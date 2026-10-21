import { createActivity } from '../application/activity.js'
import { deskIdentity, deskSummary } from '../application/desk-summary.js'
import { createEventStream } from '../application/events.js'
import { journalSubject } from '../application/journal.js'
import { planFileOf } from '../application/plan-library.js'

import { createDeskContext } from './context.js'
import {
	observedActivity,
	observedEvents,
	observedLiveness,
} from './desk-moves.js'
import { createDeskLiveness } from './liveness.js'

import type { DeskSummary } from '@syneva/contracts/hub'
import type { HubJournal } from '../application/journal.js'
import type { PlanDeskRef, PlanLibrary } from '../application/plan-library.js'
import type {
	EditorPort,
	GitPort,
	ReviewStorePort,
	SettingsPort,
} from '../application/ports.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewState } from '../domain/review.js'
import type { DeskContext } from './context.js'
import type { DeskMove } from './desk-moves.js'
import type { DeskLiveness } from './liveness.js'

// One hosted desk: its id, the context its routes run against, and the rebuild parameters the
// registry persists so a restarted hub reopens it on the same id.
export type HubDesk = {
	readonly id: string
	readonly ctx: DeskContext
	readonly liveness: DeskLiveness
	// Replaced (never mutated) when a reopen changes a rebuild parameter, such as --no-guide.
	record: HubDeskRecord
	// When the hub closed it (epoch ms), null while it is live: a closed desk is gone to every
	// caller at once and leaves the hub's map once its grace is past (hub-desks.ts).
	closedAt: number | null
}

// What every hosted desk is wired from: the hub's capability ports, the agent-activity TTL and
// the journal its events go to.
export type HostedDeskIo = {
	git: GitPort
	store: ReviewStorePort
	settings: SettingsPort
	editor: EditorPort
	journal: HubJournal
	plans: PlanLibrary
	statusTtlMs: number
}

// What a desk reaches of its hub: `close` alone drops it from the registry; `moved` tells the
// hub's subscribers what the desk shows moved (desk-moves.ts).
export type DeskHooks = {
	close: () => void
	moved: (desk: HubDesk, move: DeskMove) => void
}

// A desk over the hub's collaborators. The desk's journal binding names the desk as the hub lists
// it at the moment of each event, so a route records what happened and never who it happened to.
// A plan desk's events also reach the plan library, read off the record at that moment (a reopen
// may make a file desk a plan desk). Its commits, its status and its activity stamps are observed
// where they change, so the hub tells them when they happen.
export function hostDesk(
	io: HostedDeskIo,
	review: ReviewState,
	record: HubDeskRecord,
	hooks: DeskHooks,
): HubDesk {
	const moved = (move: DeskMove) => (): void => {
		hooks.moved(desk, move)
	}
	const liveness = observedLiveness(
		createDeskLiveness(record.openedAt),
		moved('summary'),
	)
	const desk: HubDesk = {
		id: record.id,
		liveness,
		record,
		closedAt: null,
		ctx: createDeskContext(review, record.pathFilter, {
			events: observedEvents(createEventStream(), moved('pulse')),
			activity: observedActivity(
				createActivity(io.statusTtlMs),
				moved('pulse'),
			),
			liveness,
			git: io.git,
			store: io.store,
			settings: io.settings,
			editor: io.editor,
			close: hooks.close,
			committed: moved('pulse'),
			recordEvent: (draft, verdicts) => {
				io.journal.record(
					{
						...journalSubject(
							deskIdentity(desk.id, desk.ctx.state),
						),
						...draft,
					},
					verdicts,
				)
				const plan = planDeskOf(desk)
				if (plan) io.plans.observe(plan, draft, verdicts)
			},
		}),
	}
	return desk
}

// A file desk reviews one file: its stamp is the content the reviewer has on screen.
function planDeskOf(desk: HubDesk): PlanDeskRef | null {
	const { plan, target, root } = desk.record
	if (!plan || !target) return null
	const fileHash = desk.ctx.state.files[0]?.contentHash
	return { root, file: target, fileHash }
}

// The plan a plan desk reviews (its id in the library), read off the record alone.
export function deskPlanId(desk: HubDesk): string | undefined {
	const { plan, target, root } = desk.record
	if (!plan || !target) return undefined
	return planFileOf(root, target).id
}

export function summarize(desk: HubDesk): DeskSummary {
	return {
		...deskSummary(desk.id, desk.ctx.state, desk.ctx.status(), {
			openedAt: desk.liveness.openedAt,
			lastActivityAt: desk.liveness.lastActivityAt(),
		}),
		plan: deskPlanId(desk),
	}
}
