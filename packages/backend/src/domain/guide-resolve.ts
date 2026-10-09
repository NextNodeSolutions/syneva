// A freshly attached guide against the review's inventory: the same source, every changed unit owned once, every reference landing. Pure; the lifecycle supplies the context reads.
import { resolveOwnership } from './guide-ownership.js'
import { resolveReferences } from './guide-reference-resolve.js'

import type { ContextHashes } from './guide-reference-resolve.js'
import type {
	DomainResolution,
	Guide,
	GuideIssue,
	GuideResolution,
} from './guide-shapes.js'
import type { ReviewInventory } from './inventory.js'

export type GuideResolveOutcome = {
	resolution: GuideResolution
	// Empty when the guide is valid for this inventory; otherwise every field-level problem, so one round fixes them all.
	issues: GuideIssue[]
}

function sourceIssues(guide: Guide, inventory: ReviewInventory): GuideIssue[] {
	const issues: GuideIssue[] = []
	if (guide.source.mode !== inventory.mode)
		issues.push({
			field: 'guide.source.mode',
			reason: `the guide was written for a ${guide.source.mode} review; this desk reviews ${inventory.mode}`,
		})
	if (guide.source.fingerprint !== inventory.fingerprint)
		issues.push({
			field: 'guide.source.fingerprint',
			target: inventory.fingerprint,
			reason: `the guide was written against another revision of the source (its fingerprint is ${guide.source.fingerprint}, the review's is ${inventory.fingerprint}); run \`syneva inventory\` again and author against it`,
		})
	return issues
}

// An empty changeset takes an empty guide and nothing else; a changeset with units needs at least one domain.
function coverageIssues(
	guide: Guide,
	inventory: ReviewInventory,
	unassigned: GuideResolution['unassigned'],
): GuideIssue[] {
	const isEmpty = !inventory.units.length && !inventory.fileUnits.length
	if (isEmpty && guide.domains.length)
		return [
			{
				field: 'guide.domains',
				reason: 'nothing to review: an empty changeset takes an empty domains array',
			},
		]
	if (!isEmpty && !guide.domains.length)
		return [
			{
				field: 'guide.domains',
				reason: `the review has ${inventory.units.length} changed blocks and ${inventory.fileUnits.length} file operations; a guide over them needs at least one domain`,
			},
		]
	return [
		...unassigned.units.map(key => ({
			field: 'guide.domains',
			target: key,
			reason: `changed block ${key} is owned by no domain`,
		})),
		...unassigned.files.map(path => ({
			field: 'guide.domains',
			target: path,
			reason: `file operation ${path} is owned by no domain (a "file" member)`,
		})),
	]
}

export function resolveGuide(
	guide: Guide,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): GuideResolveOutcome {
	const ownership = resolveOwnership(guide, inventory)
	const references = resolveReferences(
		guide.domains,
		inventory,
		contextHashes,
	)
	const domains: Record<string, DomainResolution> = {}
	for (const domain of guide.domains) {
		const owned = ownership.domains.get(domain.id) ?? {
			units: [],
			files: [],
		}
		domains[domain.id] = {
			units: owned.units,
			files: owned.files,
			refs: references.byDomain.get(domain.id) ?? {},
		}
	}
	return {
		resolution: {
			fingerprint: inventory.fingerprint,
			domains,
			unassigned: ownership.unassigned,
		},
		issues: [
			...sourceIssues(guide, inventory),
			...ownership.issues,
			...coverageIssues(guide, inventory, ownership.unassigned),
			...references.issues,
		],
	}
}

// One sentence an error response or a CLI prints: the first issues by field, and how many more there are.
const SHOWN_ISSUES = 4

export function describeIssues(issues: readonly GuideIssue[]): string {
	const shown = issues
		.slice(0, SHOWN_ISSUES)
		.map(issue => `${issue.field}: ${issue.reason}`)
	const more = issues.length - shown.length
	return more > 0 ? `${shown.join('; ')}; and ${more} more` : shown.join('; ')
}
