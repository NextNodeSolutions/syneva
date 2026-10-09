import { fetchPoll, fetchState } from '@entities/review/api'
import { fetchTree } from '@entities/review/file/api'
import { deferRender, render } from '@pages/desk/render'
import { updateAwaitingDom } from '@widgets/diff-view/awaiting'
import { D } from '@widgets/diff-view/runtime'

import { saver, S, toast } from './store'

import type {
	DeskPollSnapshot,
	DeskRefreshEvent,
	DeskStateSnapshot,
	DeskStatus,
	ReviewComment,
	ReviewState,
} from '@entities/review/model'

export const POLL_INTERVAL_MS = 1500

// One miss is a tick of load jitter; three ≈ 4.5s of silence is closure.
const DESK_GONE_TICKS = 3

let serverInstanceId: string | undefined
let missedPolls = 0

// A notification is safer than automatic navigation: stage/unstage/Send can still be in flight after their dialogs close.
export function isCurrentDesk(instance: string | undefined): boolean {
	if (!serverInstanceId || instance === serverInstanceId) return true
	S.isRefreshRequired = true
	return false
}

// They must never enter S.state: persist() posts S.state back to /save, and the persisted review must not carry desk liveness.
function adoptLiveness(status: Partial<DeskStatus>): void {
	S.agentActivity = status.agentActivity?.body ?? null
	S.agentListening = status.agentListening ?? false
	S.queuedQuestions = status.queuedQuestions ?? 0
	S.queuedReviews = status.queuedReviews ?? 0
}

export function adoptDeskStatus(payload: DeskStateSnapshot): ReviewState {
	const {
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
		serverInstanceId: instance,
		...review
	} = payload
	serverInstanceId ??= instance
	adoptLiveness({
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
	})
	return review
}

function adoptPollStatus(
	payload: DeskPollSnapshot & DeskStatus,
): DeskPollSnapshot {
	const {
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
		...lite
	} = payload
	adoptLiveness({
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
	})
	return lite
}

async function pollOnce(): Promise<DeskPollSnapshot | DeskRefreshEvent | null> {
	try {
		const query = serverInstanceId
			? `?instance=${encodeURIComponent(serverInstanceId)}`
			: ''
		const payload = await fetchPoll(query)
		missedPolls = 0
		S.deskClosed = false
		if ('kind' in payload) {
			adoptLiveness({})
			updateAwaitingDom()
			return payload
		}
		if (!Array.isArray(payload.comments)) return null
		const lite = adoptPollStatus(payload)
		updateAwaitingDom()
		return lite
	} catch {
		missedPolls++
		if (missedPolls >= DESK_GONE_TICKS) S.deskClosed = true
		return null
	}
}

async function loadReviewState(): Promise<ReviewState | null> {
	try {
		const payload = await fetchState()
		if (!isCurrentDesk(payload.serverInstanceId)) return null
		const server = adoptDeskStatus(payload)
		if (!Array.isArray(server.comments)) return null
		return server
	} catch {
		return null
	}
}

// File order/membership can change (files added, removed or reordered), so re-find the current path
// in the new list rather than trusting the numeric index - otherwise the shown file, and guided
// auto-advance (which resolves "next" from the current index), silently jump to whatever sits there.
function adoptReloadedState(server: ReviewState): void {
	const curPath = S.state?.files[S.fileIndex]?.path
	S.state = server
	D.fileDiff = null
	const remapped = curPath
		? server.files.findIndex(f => f.path === curPath)
		: -1
	if (remapped >= 0) S.fileIndex = remapped
	else if (S.fileIndex >= server.files.length) S.fileIndex = 0
}

async function refreshProjectFiles(): Promise<void> {
	try {
		const tree = await fetchTree()
		if (tree.files) S.projectFiles = tree.files
	} catch {
		/* a failed refresh leaves the previous listing in place (chrome, not review data) */
	}
}

// The guide and its resolution move together (a swap or a reload refreshes both); a changed resolution alone (a reload that only marked staleness) counts too.
function adoptGuide(lite: DeskPollSnapshot): boolean {
	const { state } = S
	if (!state) return false
	const incoming = JSON.stringify([
		lite.guide ?? null,
		lite.guideResolution ?? null,
	])
	const current = JSON.stringify([
		state.guide ?? null,
		state.guideResolution ?? null,
	])
	if (incoming === current) return false
	state.guide = lite.guide
	state.guideResolution = lite.guideResolution
	return true
}

// Additive by design: removals only ever arrive with a full state adopt.
function adoptIncomingComments(comments: ReviewComment[]): boolean {
	const { state } = S
	if (!state) return false
	const localIds = new Set(state.comments.map(c => c.id))
	const incoming = comments.filter(c => !localIds.has(c.id))
	if (!incoming.length) return false
	state.comments.push(...incoming)
	if (incoming.some(c => c.role === 'agent')) {
		S.awaitingAgent = false
		toast('Agent replied')
	}
	return true
}

async function adoptReload(): Promise<void> {
	const server = await loadReviewState()
	if (!server) return
	S.lastBaseDiffHash = server.baseDiffHash
	adoptReloadedState(server)
	S.awaitingAgent = false
	await refreshProjectFiles()
	void render()
	toast('Diff updated')
}

// Fetch the browser review only when baseDiffHash moves; never poll its file/change arrays.
export async function pollState(): Promise<void> {
	const lite = await pollOnce()
	if (!lite) return
	if ('kind' in lite) {
		S.isRefreshRequired = true
		return
	}
	if (lite.baseDiffHash !== S.lastBaseDiffHash) {
		// The reload branch replaces S.state wholesale and re-renders, which would clobber
		// decisions/comments not yet persisted and rebuild the diff DOM under an open composer
		// (losing in-progress typing): defer while a save is busy OR a composer is open - the next
		// tick re-detects the changed hash and adopts once the save drained and the composer closed.
		// Scoping the composer guard here (not at the top) keeps liveness/presence and additive
		// agent-reply merges running every tick, so the desk never looks dead.
		if (saver.isBusy() || S.composerOpen || S.fileComposerOpen) return
		await adoptReload()
		return
	}
	const guideChanged = adoptGuide(lite)
	const commentsChanged = adoptIncomingComments(lite.comments)
	if (guideChanged) toast('Guide updated')
	// These arrive on a background tick while the reviewer may be mid-scroll or mid-compose: they must not stack a synchronous full rebuild on top of their interaction.
	if (guideChanged || commentsChanged) deferRender()
}
