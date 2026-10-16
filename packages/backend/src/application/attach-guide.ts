import { composeGuide } from '../domain/guide-compose.js'
import { sideOrder } from '../domain/guide-draft-members.js'
import { describeIssues, resolveGuide } from '../domain/guide-resolve.js'
import { buildInventory } from '../domain/inventory.js'

import { readContextHashes } from './guide-context.js'

import type { CurrentGuide } from '../domain/guide-compose-context.js'
import type { Composition } from '../domain/guide-compose.js'
import type {
	AuthoredGuide,
	DomainResolution,
	Guide,
	GuideIssue,
	GuideResolution,
} from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

// Spread onto the review state: the guide stamped to the diff it was attached to, and where it stands against it.
export type GuideAttachment = {
	guide: Guide
	guideResolution: GuideResolution
}

export type AttachOutcome =
	| { ok: true; attachment: GuideAttachment }
	| { ok: false; reason: string; issues: GuideIssue[] }

function currentGuideOf(state: ReviewState): CurrentGuide | undefined {
	if (!state.guide) return undefined
	return {
		guide: state.guide,
		drafted: new Set(state.guideResolution?.drafted ?? []),
		overviewDrafted: state.guideResolution?.overviewDrafted ?? false,
		stale: new Set(
			Object.entries(state.guideResolution?.domains ?? {}).flatMap(
				([id, entry]) => (entry.stale ? [id] : []),
			),
		),
	}
}

// A stale explained domain the post left out but took blocks from: its words were never checked, so it keeps its attach-time identities and its stale mark, minus the blocks that now belong to another domain - the next reload then still finds what changed under what it kept.
function strippedStale(
	id: string,
	carried: DomainResolution,
	fresh: GuideResolution,
): DomainResolution {
	const others = Object.entries(fresh.domains).filter(
		([otherId]) => otherId !== id,
	)
	const units = new Set(
		others.flatMap(([, entry]) => entry.units.map(unit => unit.key)),
	)
	const files = new Set(others.flatMap(([, entry]) => entry.files))
	return {
		...carried,
		units: carried.units.filter(unit => !units.has(unit.key)),
		files: carried.files.filter(file => !files.has(file)),
	}
}

// The attach-time resolution a domain keeps instead of resolving afresh: one the post left as it was, or a stale explained one it left out (strippedStale). Undefined for the domains being explained or drawn now.
function carriedOf(
	state: ReviewState,
	posted: AuthoredGuide,
	composition: Composition,
): (id: string) => DomainResolution | undefined {
	const carried = state.guideResolution?.domains ?? {}
	const postedIds = new Set(posted.domains.map(domain => domain.id))
	return id => {
		const previous = carried[id]
		if (!composition.touched.has(id)) return previous
		const isOmittedStale =
			previous?.stale &&
			!postedIds.has(id) &&
			!composition.drafted.has(id)
		if (!isOmittedStale) return undefined
		return previous
	}
}

// A domain the post left as it was keeps the resolution it had - its attach-time identities, its staleness - so laying a guide over the desk never makes stale code read as current.
function keptResolution(
	state: ReviewState,
	posted: AuthoredGuide,
	composition: Composition,
	fresh: GuideResolution,
): GuideResolution {
	const carriedResolution = carriedOf(state, posted, composition)
	const resolutionOf = (
		id: string,
		entry: DomainResolution,
	): DomainResolution => {
		const previous = carriedResolution(id)
		if (!previous) return entry
		return composition.touched.has(id)
			? strippedStale(id, previous, fresh)
			: previous
	}
	const domains = Object.fromEntries(
		Object.entries(fresh.domains).map(([id, entry]) => [
			id,
			resolutionOf(id, entry),
		]),
	)
	return {
		...fresh,
		domains,
		drafted: [...composition.drafted],
		overviewDrafted: composition.overviewDrafted,
	}
}

// A posted guide laid over the desk's current one (its draft included), then judged against the review it is meant for: the same source, complete coverage, every reference landing. Nothing about the review changes here - the caller commits the attachment or refuses the request.
export async function attachGuide(
	state: ReviewState,
	pathFilter: string | undefined,
	posted: AuthoredGuide,
	git: GitPort,
): Promise<AttachOutcome> {
	const inventory = buildInventory(state, pathFilter)
	const composition = composeGuide(posted, currentGuideOf(state), {
		inventory,
		order: sideOrder(inventory.units),
	})
	if (composition.issues.length)
		return {
			ok: false,
			reason: describeIssues(composition.issues),
			issues: composition.issues,
		}
	const contextHashes = await readContextHashes(state, composition.guide, git)
	// Only the domains this post explains must cite code that is there: a carried domain keeps its own stale references until it is explained, so explaining in separate passes is never refused over another domain's.
	const carriedResolution = carriedOf(state, posted, composition)
	const { resolution, issues } = resolveGuide(
		composition.guide,
		inventory,
		contextHashes,
		id => !carriedResolution(id),
	)
	if (issues.length)
		return { ok: false, reason: describeIssues(issues), issues }
	return {
		ok: true,
		attachment: {
			guide: { ...composition.guide, baseDiffHash: state.baseDiffHash },
			guideResolution: keptResolution(
				state,
				posted,
				composition,
				resolution,
			),
		},
	}
}
