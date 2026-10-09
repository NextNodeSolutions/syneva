import { describeIssues, resolveGuide } from '../domain/guide-resolve.js'
import { buildInventory } from '../domain/inventory.js'

import { readContextHashes } from './guide-context.js'

import type {
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

// A guide the schema admitted, now against the review it is meant for: the same source, complete coverage, every reference landing. Nothing about the review changes here - the caller commits the attachment or refuses the request.
export async function attachGuide(
	state: ReviewState,
	pathFilter: string | undefined,
	guide: Guide,
	git: GitPort,
): Promise<AttachOutcome> {
	const inventory = buildInventory(state, pathFilter)
	const contextHashes = await readContextHashes(state, guide, git)
	const { resolution, issues } = resolveGuide(guide, inventory, contextHashes)
	if (issues.length)
		return { ok: false, reason: describeIssues(issues), issues }
	return {
		ok: true,
		attachment: {
			guide: { ...guide, baseDiffHash: state.baseDiffHash },
			guideResolution: resolution,
		},
	}
}
