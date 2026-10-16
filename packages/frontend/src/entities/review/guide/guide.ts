import { flowIndex } from '../changes'

import { domainsOwningPath, guideFileEntries } from './domains'
import { isGuideBaseStale } from './guide-derive'
import { anyDomainStale } from './resolution'
import { navFileOrder, wrapNextTarget, wrapPrevTarget } from './seek'
import { lineStats } from './walkthrough'

import type { FlowIndex } from '../change/flow-index'
import type { ReviewState } from '../model'
import type { GuideDomain } from './model'

export type GuideInputs = {
	state: ReviewState | null
	fileIndex: number
	hideReviewed: boolean
	progressBy: 'lines' | 'files'
}

export function guideInputs(S: {
	state: ReviewState | null
	fileIndex: number
	settings: { hideReviewed: boolean; progressBy: 'lines' | 'files' }
}): GuideInputs {
	return {
		state: S.state,
		fileIndex: S.fileIndex,
		hideReviewed: S.settings.hideReviewed,
		progressBy: S.settings.progressBy,
	}
}

// A guide with no domains (an empty changeset) carries nothing to walk: every guide surface stays off, as without a guide.
export function hasGuide(g: GuideInputs): boolean {
	return !!g.state?.guide?.domains.length
}

// File indices in reading order, each file once at its first domain: the Next/Prev order the walkthrough follows.
export function guideOrder(g: GuideInputs): number[] {
	const { state } = g
	if (!state?.guide?.domains.length) return []
	const byPath = new Map(state.files.map((f, i) => [f.path, i] as const))
	const seen = new Set<number>()
	const order: number[] = []
	for (const entry of guideFileEntries(state.guide)) {
		const index = byPath.get(entry.path)
		if (typeof index !== 'number' || seen.has(index)) continue
		seen.add(index)
		order.push(index)
	}
	return order
}

export function firstGuideIndex(g: GuideInputs): number {
	const nav = navOrder(g)
	if (nav.length) return nav[0] ?? 0
	const order = guideOrder(g)
	return order[0] ?? 0
}

function outOfBand(
	g: GuideInputs,
	ix: FlowIndex,
	cur: number,
): (i: number) => boolean {
	const { outOfFlow } = ix
	const path = g.state?.files.at(cur)?.path
	const curOutOfFlow = !!path && outOfFlow.has(path)
	return i => {
		const p = g.state?.files.at(i)?.path
		return (!!p && outOfFlow.has(p)) !== curOutOfFlow
	}
}

function stepCandidates(
	g: GuideInputs,
	cur: number,
	direction: 1 | -1,
): number[] {
	const order = hasGuide(g) ? guideOrder(g) : []
	const pos = order.indexOf(cur)
	if (pos < 0) {
		const count = g.state?.files.length ?? 0
		const candidates: number[] = []
		for (let i = cur + direction; i >= 0 && i < count; i += direction)
			candidates.push(i)
		return candidates
	}
	const candidates: number[] = []
	for (let p = pos + direction; p >= 0 && p < order.length; p += direction) {
		const candidate = order[p]
		if (candidate !== undefined) candidates.push(candidate)
	}
	return candidates
}

function firstInBand(
	candidates: number[],
	skip: (i: number) => boolean,
): number | null {
	for (const i of candidates) if (!skip(i)) return i
	return null
}

export function nextFileIndex(g: GuideInputs, cur: number): number | null {
	return firstInBand(
		stepCandidates(g, cur, 1),
		outOfBand(g, flowIndexOf(g), cur),
	)
}

export function prevFileIndex(g: GuideInputs, cur: number): number | null {
	return firstInBand(
		stepCandidates(g, cur, -1),
		outOfBand(g, flowIndexOf(g), cur),
	)
}

// Without a guide: the file array. With one: the guide order followed by every changed file the guide did NOT list (the walkthrough's "Other"), in file-array order, so the seek reaches unlisted files and never dead-ends on a partial guide.
// Files out of the flow are excluded - the single choke point that keeps wrap/approve-advance seeks off files with nothing to review. Plain mid-list stepping reads its own band order, never this.
function navOrderWith(g: GuideInputs, ix: FlowIndex): number[] {
	const count = g.state?.files.length ?? 0
	return navFileOrder(count, hasGuide(g) ? guideOrder(g) : null, i => {
		const p = g.state?.files.at(i)?.path
		return !!p && !ix.outOfFlow.has(p)
	})
}

function flowIndexOf(g: GuideInputs): FlowIndex {
	return flowIndex(g.state, { distill: g.hideReviewed })
}

export function navOrder(g: GuideInputs): number[] {
	return navOrderWith(g, flowIndexOf(g))
}

function seekFinishedWith(
	g: GuideInputs,
	ix: FlowIndex,
): (i: number) => boolean {
	return i => {
		const path = g.state?.files.at(i)?.path
		return !!path && ix.finished(path)
	}
}

export function anyUnreviewed(g: GuideInputs): boolean {
	const ix = flowIndexOf(g)
	return navOrderWith(g, ix).some(i => !seekFinishedWith(g, ix)(i))
}

export function nextWrapIndex(g: GuideInputs): number | null {
	const ix = flowIndexOf(g)
	return wrapNextTarget(navOrderWith(g, ix), seekFinishedWith(g, ix))
}

export function prevWrapIndex(g: GuideInputs): number | null {
	const ix = flowIndexOf(g)
	return wrapPrevTarget(navOrderWith(g, ix), seekFinishedWith(g, ix))
}

function locByPath(state: ReviewState): Map<string, number> {
	const m = new Map<string, number>()
	for (const [path, s] of lineStats(state.files))
		m.set(path, Math.max(s.added + s.removed, 1))
	return m
}

export function guideProgress(g: GuideInputs): {
	done: number
	approved: number
	total: number
	pct: number
} {
	const PERCENT_SCALE = 100
	const isByLines = g.progressBy !== 'files'
	const linesPerFile = isByLines && g.state ? locByPath(g.state) : null
	const ix = flowIndexOf(g)
	let total = 0,
		done = 0,
		approved = 0
	for (const f of g.state?.files ?? []) {
		if (ix.outOfFlow.has(f.path) || ix.distilled.has(f.path)) continue
		const weight = linesPerFile ? (linesPerFile.get(f.path) ?? 1) : 1
		total += weight
		const st = ix.reviewState(f.path)
		if (st !== 'pending') done += weight
		if (st === 'approved') approved += weight
	}
	// total === 0 means every changed file is out of the flow: nothing needs review, so the bar reads complete rather than a misleading 0%.
	return {
		done,
		approved,
		total,
		pct: total ? Math.round((done / total) * PERCENT_SCALE) : PERCENT_SCALE,
	}
}

// The domains owning the shown file, highest risk first: the file header names them.
export function currentFileDomains(g: GuideInputs): GuideDomain[] {
	const { state } = g
	if (!state?.guide) return []
	const f = state.files.at(g.fileIndex)
	if (!f) return []
	return domainsOwningPath(state.guide, f.path)
}

export function currentFileName(g: GuideInputs): string {
	return g.state?.files.at(g.fileIndex)?.path.split('/').pop() ?? ''
}

export function showGuideBar(g: GuideInputs): boolean {
	return hasGuide(g)
}

// Stale once a reload marked any domain so, or moved the diff past the guide's stamp without a resolution to say which domain it touched.
export function guideStale(g: GuideInputs): boolean {
	const { state } = g
	if (!state?.guide) return false
	if (state.guideResolution) return anyDomainStale(state)
	return isGuideBaseStale(state.baseDiffHash, state.guide.baseDiffHash)
}
