// What the desk tab adopts from its hub between two reads of its state: the whole review again
// when its diff moved, otherwise the guide and the conversation, additively. app/desk-stream.ts
// decides which, from each pulse the hub's stream carries.
import { fetchState } from '@entities/review/api'
import { fetchTree } from '@entities/review/file/api'
import { render } from '@pages/desk/render'
import { D } from '@widgets/diff-view/runtime'

import { adoptDeskStatus, isCurrentDesk } from './desk-instance'
import { S, toast } from './store'

import type {
	DeskPulse,
	DomainComment,
	ReviewComment,
	ReviewState,
} from '@entities/review/model'

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
	// The selected domain survives a reload while the guide keeps it; a swap that dropped it clears the selection rather than pointing at another domain by position.
	if (
		S.domainId &&
		!server.guide?.domains.some(domain => domain.id === S.domainId)
	)
		S.domainId = null
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
export function adoptGuide(pulse: DeskPulse): boolean {
	const { state } = S
	if (!state) return false
	const incoming = JSON.stringify([
		pulse.guide ?? null,
		pulse.guideResolution ?? null,
		pulse.guideExpected ?? false,
	])
	const current = JSON.stringify([
		state.guide ?? null,
		state.guideResolution ?? null,
		state.guideExpected ?? false,
	])
	if (incoming === current) return false
	state.guide = pulse.guide
	state.guideResolution = pulse.guideResolution
	state.guideExpected = pulse.guideExpected
	return true
}

// Additive by design: removals only ever arrive with a full state adopt.
export function adoptIncomingComments(comments: ReviewComment[]): boolean {
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

function adoptNewDomainComment(
	state: ReviewState,
	incoming: DomainComment,
): void {
	state.domainComments.push(incoming)
	if (incoming.role !== 'agent') return
	S.awaitingAgent = false
	toast('Agent replied')
}

// Agent replies in guide threads arrive the same way; whether a known thread still has its target is the hub's call (a guide swap in another pulse), so that flag is taken as given.
export function adoptIncomingDomainComments(
	comments: DomainComment[],
): boolean {
	const { state } = S
	if (!state) return false
	const known = new Map(state.domainComments.map(c => [c.id, c]))
	let hasChanged = false
	for (const incoming of comments) {
		const local = known.get(incoming.id)
		if (!local) {
			adoptNewDomainComment(state, incoming)
			hasChanged = true
			continue
		}
		if ((local.unanchored ?? false) === (incoming.unanchored ?? false))
			continue
		local.unanchored = incoming.unanchored
		hasChanged = true
	}
	return hasChanged
}

export async function adoptReload(): Promise<void> {
	const server = await loadReviewState()
	if (!server) return
	S.lastBaseDiffHash = server.baseDiffHash
	adoptReloadedState(server)
	S.awaitingAgent = false
	await refreshProjectFiles()
	void render()
	toast('Diff updated')
}
