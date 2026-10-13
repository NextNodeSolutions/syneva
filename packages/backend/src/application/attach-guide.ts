import { composeGuide } from '../domain/guide-compose.js'
import { sideOrder } from '../domain/guide-draft-members.js'
import { changeLinks } from '../domain/guide-redraft.js'
import { describeIssues, resolveGuide } from '../domain/guide-resolve.js'
import { buildInventory } from '../domain/inventory.js'

import { readContextHashes } from './guide-context.js'

import type { CurrentGuide } from '../domain/guide-compose-context.js'
import type { Composition } from '../domain/guide-compose.js'
import type {
	AuthoredGuide,
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

// A domain the post left as it was keeps the resolution it had - its attach-time identities, its staleness - so laying a guide over the desk never makes stale code read as current.
function keptResolution(
	state: ReviewState,
	composition: Composition,
	fresh: GuideResolution,
): GuideResolution {
	const carried = state.guideResolution?.domains ?? {}
	const domains = Object.fromEntries(
		Object.entries(fresh.domains).map(([id, entry]) => [
			id,
			composition.touched.has(id) ? entry : (carried[id] ?? entry),
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
		links: changeLinks(state.changes),
		order: sideOrder(inventory.units),
	})
	if (composition.issues.length)
		return {
			ok: false,
			reason: describeIssues(composition.issues),
			issues: composition.issues,
		}
	const contextHashes = await readContextHashes(state, composition.guide, git)
	const { resolution, issues } = resolveGuide(
		composition.guide,
		inventory,
		contextHashes,
	)
	if (issues.length)
		return { ok: false, reason: describeIssues(issues), issues }
	return {
		ok: true,
		attachment: {
			guide: { ...composition.guide, baseDiffHash: state.baseDiffHash },
			guideResolution: keptResolution(state, composition, resolution),
		},
	}
}
