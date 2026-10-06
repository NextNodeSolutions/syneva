import { randomUUID } from 'node:crypto'

import { createSerializer } from '../../../application/mutex.js'
import { readStagedSnapshot } from '../../../application/reconcile.js'
import { createStateBodyCache } from '../../../application/state-cache.js'
import { createStateOwner } from '../../../application/state-owner.js'

import type { ReviewResult } from '@syneva/contracts/agent'
import type { DeskStatus } from '@syneva/contracts/browser'
import type { DeskActivity } from '../../../application/activity.js'
import type { EventStream } from '../../../application/events.js'
import type { DeskEventDraft } from '../../../application/journal.js'
import type { Serializer } from '../../../application/mutex.js'
import type {
	EditorPort,
	GitPort,
	ReviewStorePort,
	SettingsPort,
} from '../../../application/ports.js'
import type { StateBodyCache } from '../../../application/state-cache.js'
import type { ReviewState } from '../../../domain/review.js'
import type { DeskLiveness } from './liveness.js'

// Persist outcome for a route: the stamped root to commit + the file it was written to.
export type PersistedState = { state: ReviewState; file: string }

// Everything a route needs from one hosted desk; the hub holds ONE per desk, nothing process-wide.
export type DeskContext = {
	// Changes whenever the desk is (re)created; a restored desk carries a new one - how an open tab learns to refresh (see /poll).
	instanceId: string
	// Copy-on-write: mutations build a new root (unchanged branches shared, published via
	// commit); a reader captures a consistent snapshot from one atomic reference read.
	readonly state: ReviewState
	// Monotonic, advanced only when a mutation commits a different root (a same root is a no-op);
	// the /state body cache keys on it.
	readonly revision: number
	events: EventStream
	activity: DeskActivity
	liveness: DeskLiveness
	// Application-owned capability ports, wired by the composition root (bootstrap/hub).
	git: GitPort
	store: ReviewStorePort
	settings: SettingsPort
	editor: EditorPort
	// One promise-chain mutex ordering every mutating route: a concurrent /send and /reload each compute their next root from the latest committed one (the two-actor window).
	// It no longer guards reads (copy-on-write snapshots are atomic enough alone); the /await-send long-poll MUST stay out - it parks a whole round, so serializing it would wedge every mutation behind a waiter only a mutation releases.
	serialize: Serializer
	// The ONLY way live state changes: a differing root goes live and advances the revision; the same root is a no-op, so an unchanged desk keeps its cached /state body.
	commit(next: ReviewState): void
	// Persist `next` and hand back the stamped root to commit (the written file's updatedAt/persistFile stamp is adopted as a state change) plus the file path (Send writes its result artifact there).
	persist(next: ReviewState): Promise<PersistedState>
	// The serialized /state body, keyed on the application revision plus the transient desk
	// status (state-cache.ts).
	stateBodyCache: StateBodyCache
	status(): DeskStatus
	// Reflect the live git index onto the review for the read routes (/state, /tree).
	refreshStaged(): Promise<void>
	// Close this desk on the hub: a `closed` event reaches a parked agent waiter, then the desk
	// leaves the registry; the review state stays saved and the hub keeps running.
	close(): void
	// Journal what just happened on this desk, once it has (after the commit): the hub binds the
	// desk's subject, the journal stamps the seq and time. Never throws and never waits - a
	// journal write failure is logged, never the failure of the request that recorded it. A Send
	// and the await that delivers it pass their ReviewResult, which ties the pickup to its round.
	recordEvent(draft: DeskEventDraft, verdicts?: ReviewResult): void
}

export function createDeskContext(
	state: ReviewState,
	collaborators: {
		events: EventStream
		activity: DeskActivity
		liveness: DeskLiveness
		git: GitPort
		store: ReviewStorePort
		settings: SettingsPort
		editor: EditorPort
		close: () => void
		recordEvent: (draft: DeskEventDraft, verdicts?: ReviewResult) => void
	},
): DeskContext {
	const { events, activity, git, store, close } = collaborators
	const runMutation = createSerializer()
	const stateBodyCache = createStateBodyCache()
	const owner = createStateOwner(state)
	return {
		...collaborators,
		instanceId: randomUUID(),
		stateBodyCache,
		get state(): ReviewState {
			return owner.state
		},
		get revision(): number {
			return owner.revision
		},
		commit: owner.commit,
		serialize: runMutation,
		status(): DeskStatus {
			return deskStatus(events, activity)
		},
		refreshStaged(): Promise<void> {
			return refreshStagedIndex(
				() => owner.state,
				git,
				runMutation,
				owner.commit,
			)
		},
		persist(next: ReviewState): Promise<PersistedState> {
			return persistState(store, next)
		},
		close,
	}
}

// Persist `next` and hand back the stamped root to commit; the written file's stamp is adopted
// as a state change like any other.
async function persistState(
	store: ReviewStorePort,
	next: ReviewState,
): Promise<PersistedState> {
	const persisted = await store.persistReview(next)
	return { state: { ...next, ...persisted.stamp }, file: persisted.file }
}

function deskStatus(events: EventStream, activity: DeskActivity): DeskStatus {
	const queued = events.queuedCounts()
	return {
		agentActivity: activity.read(),
		agentListening: events.listenerCount() > 0,
		queuedQuestions: queued.questions,
		queuedReviews: queued.reviews,
	}
}

// Read the index outside the write mutex (a git spawn is the desk's slowest op) and re-validate under it: a mutation mid-read recomputes against the newest root instead of overwriting it.
// An unchanged index commits nothing.
async function refreshStagedIndex(
	read: () => ReviewState,
	git: GitPort,
	runMutation: Serializer,
	commit: (next: ReviewState) => void,
): Promise<void> {
	// Capture the root, then read the index mutex-free; the write runs only when the snapshot moved the staged bookkeeping.
	const observed = read()
	const snapshot = await readStagedSnapshot(observed, git)
	await runMutation(async () => {
		const live = read()
		// A commit landed during the index read: the snapshot was filtered against the observed
		// root's file list, so recompute against the live one (rare mutation-read race).
		const fresh =
			live === observed ? snapshot : await readStagedSnapshot(live, git)
		if (!stagedSnapshotMoved(live, fresh)) return
		commit({ ...live, ...fresh })
	})
}

// Both arrays come from the same git output in the same order on every read, so a positional
// compare is exact - and unlike a set compare it still catches a genuine reorder.
function stagedSnapshotMoved(
	state: ReviewState,
	snapshot: {
		stagedFiles: readonly string[]
		stagedChangeKeys: readonly string[] | undefined
	},
): boolean {
	return (
		!samePaths(state.stagedFiles, snapshot.stagedFiles) ||
		!samePaths(
			state.stagedChangeKeys ?? [],
			snapshot.stagedChangeKeys ?? [],
		)
	)
}

function samePaths(
	current: readonly string[],
	next: readonly string[],
): boolean {
	return (
		current.length === next.length &&
		current.every((path, index) => path === next[index])
	)
}
