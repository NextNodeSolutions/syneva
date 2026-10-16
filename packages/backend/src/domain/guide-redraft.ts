// A guided desk's guide kept whole: on every open, restore and reload, the code no explained domain owns is drafted into domains of its own (guide-draft.ts), so the desk is never without a guide nor with code no domain owns. Drafted domains are Syneva's - kept while they own exactly that code, drawn again once it changed - while explained ones are the agent's, only ever reconciled.
import { changeKey } from './change-blocks.js'
import { isLockfilePath } from './changed-paths.js'
import { reanchorDomainComments } from './domain-comments.js'
import { prunedLinks } from './guide-compose-context.js'
import {
	DRAFT_DOMAINS_MAX,
	draftDomains,
	draftOverview,
} from './guide-draft.js'
import { resolveOwnership } from './guide-ownership.js'
import { resolveGuide } from './guide-resolve.js'
import { GUIDE_FORMAT, GUIDE_LIMITS } from './guide-shapes.js'
import { buildInventory } from './inventory.js'

import type {
	Guide,
	GuideDomain,
	GuideResolution,
	OwnedUnit,
} from './guide-shapes.js'
import type { ReviewInventory } from './inventory.js'
import type { ChangeState, ReviewState } from './review.js'

// Per block key, the changed declarations its declaration references.
export function changeLinks(
	changes: readonly ChangeState[],
): Map<string, readonly string[]> {
	return new Map(
		changes.flatMap(change =>
			change.links ? [[changeKey(change), change.links] as const] : [],
		),
	)
}

// A domain of lockfiles only is complete as drafted: its text is a fact about generated files, not a reading an agent has to give (it gets no packet to explain).
export function isMechanicalDomain(domain: GuideDomain): boolean {
	return domain.members.every(member => isLockfilePath(member.path))
}

export function sourceOf(inventory: ReviewInventory): Guide['source'] {
	return {
		mode: inventory.mode,
		fingerprint: inventory.fingerprint,
		head: inventory.head,
		base: inventory.base,
		staged: inventory.staged,
		path: inventory.path,
	}
}

type Explained = {
	guide: Guide
	domains: GuideDomain[]
	resolution: GuideResolution | undefined
}

function explainedOf(state: ReviewState): Explained | null {
	if (!state.guide) return null
	const drafted = new Set(state.guideResolution?.drafted ?? [])
	const domains = state.guide.domains.filter(
		domain => !drafted.has(domain.id),
	)
	if (!domains.length) return null
	return { guide: state.guide, domains, resolution: state.guideResolution }
}

function guideOf(
	state: ReviewState,
	inventory: ReviewInventory,
	explained: Explained | null,
	drafts: GuideDomain[],
): Guide {
	if (explained) {
		const ids = new Set(
			[...explained.domains, ...drafts].map(domain => domain.id),
		)
		// An explained domain's link to a draft that is no more is dropped with it.
		const kept = explained.domains.map(domain => prunedLinks(domain, ids))
		return { ...explained.guide, domains: [...kept, ...drafts] }
	}
	return {
		format: GUIDE_FORMAT,
		source: sourceOf(inventory),
		overview: authoredOverview(state) ?? draftOverview(inventory, drafts),
		domains: drafts,
		baseDiffHash: state.baseDiffHash,
	}
}

// The overview the agent wrote is its own, whether or not any domain is explained yet (a lockfile-only desk has none to explain).
function authoredOverview(state: ReviewState): string | undefined {
	if (!state.guide || state.guideResolution?.overviewDrafted) return undefined
	return state.guide.overview
}

type Drafted = {
	readonly guide: Guide
	readonly domains: GuideDomain[]
	// What no explained domain owns: the scope the drafts were drawn over.
	readonly leftover: { units: string[]; files: string[] }
}

function resolutionOf(
	state: ReviewState,
	inventory: ReviewInventory,
	explained: Explained | null,
	drafts: Drafted,
): GuideResolution {
	const fresh = resolveGuide(
		{ ...drafts.guide, domains: drafts.domains },
		inventory,
		new Map(),
	).resolution
	const kept = Object.fromEntries(
		(explained?.domains ?? []).flatMap(domain => {
			const entry = explained?.resolution?.domains[domain.id]
			return entry ? [[domain.id, entry] as const] : []
		}),
	)
	const owned = new Set(
		Object.values(fresh.domains).flatMap(entry =>
			entry.units.map(unit => unit.key),
		),
	)
	const ownedFiles = new Set(
		Object.values(fresh.domains).flatMap(entry => entry.files),
	)
	const { leftover } = drafts
	return {
		fingerprint:
			explained?.resolution?.fingerprint ?? inventory.fingerprint,
		domains: { ...kept, ...fresh.domains },
		unassigned: {
			units: leftover.units.filter(key => !owned.has(key)),
			files: leftover.files.filter(file => !ownedFiles.has(file)),
		},
		drafted: drafts.domains.map(domain => domain.id),
		overviewDrafted: explained
			? (explained.resolution?.overviewDrafted ?? false)
			: typeof authoredOverview(state) !== 'string',
	}
}

// What no explained domain owns: the whole review when nothing is explained yet.
function leftoverOf(
	inventory: ReviewInventory,
	explained: Explained | null,
): Drafted['leftover'] {
	if (!explained)
		return {
			units: inventory.units.map(unit => unit.key),
			files: inventory.fileUnits,
		}
	return resolveOwnership(
		{ ...explained.guide, domains: explained.domains },
		inventory,
	).unassigned
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
	const members = new Set(left)
	return (
		members.size === new Set(right).size &&
		right.every(entry => members.has(entry))
	)
}

// Same blocks with the same content as when the draft was drawn: an edit in place keeps a block's key, but its names and counts may no longer be the draft's.
function sameCode(
	drawn: readonly OwnedUnit[] | undefined,
	now: readonly OwnedUnit[],
): boolean {
	if (!drawn || drawn.length !== now.length) return false
	const hashes = new Map(now.map(unit => [unit.key, unit.contentHash]))
	return drawn.every(unit => hashes.get(unit.key) === unit.contentHash)
}

// The drafts in place, kept while they own exactly the code no explained domain owns, unchanged: a reload that changed none of it keeps the same domains, ids and order.
function standingDrafts(
	state: ReviewState,
	inventory: ReviewInventory,
	leftover: Drafted['leftover'],
): GuideDomain[] | null {
	const drafted = new Set(state.guideResolution?.drafted ?? [])
	const domains = (state.guide?.domains ?? []).filter(domain =>
		drafted.has(domain.id),
	)
	if (!state.guide || !domains.length) return null
	const owned = resolveOwnership({ ...state.guide, domains }, inventory)
	const holdings = [...owned.domains.values()]
	const isWhole = holdings.every(
		holding => holding.units.length || holding.files.length,
	)
	if (!isWhole || owned.issues.length) return null
	const units = holdings.flatMap(holding =>
		holding.units.map(unit => unit.key),
	)
	const files = holdings.flatMap(holding => holding.files)
	const isExact =
		sameSet(units, leftover.units) && sameSet(files, leftover.files)
	if (!isExact) return null
	const drawn = state.guideResolution?.domains ?? {}
	const isUnchanged = [...owned.domains].every(([id, holding]) =>
		sameCode(drawn[id]?.units, holding.units),
	)
	if (!isUnchanged) return null
	return domains
}

export function redraftGuide(
	state: ReviewState,
	pathFilter: string | undefined,
): ReviewState {
	const inventory = buildInventory(state, pathFilter)
	const explained = explainedOf(state)
	const leftover = leftoverOf(inventory, explained)
	const drafts =
		standingDrafts(state, inventory, leftover) ??
		draftDomains({
			inventory,
			links: changeLinks(state.changes),
			scope: {
				units: new Set(leftover.units),
				files: new Set(leftover.files),
			},
			takenIds: new Set(explained?.domains.map(domain => domain.id)),
			maxDomains: Math.min(
				DRAFT_DOMAINS_MAX,
				GUIDE_LIMITS.domains - (explained?.domains.length ?? 0),
			),
		})
	const guide =
		explained || drafts.length
			? guideOf(state, inventory, explained, drafts)
			: undefined
	return {
		...state,
		guide,
		guideResolution:
			guide &&
			resolutionOf(state, inventory, explained, {
				guide,
				domains: drafts,
				leftover,
			}),
		domainComments: reanchorDomainComments(
			state.domainComments ?? [],
			guide,
		),
	}
}
