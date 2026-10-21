// The words of a drafted domain, all of them facts read from the changeset: where it sits, what it declares, how much it changes. The risk is a prior from the paths alone (sensitive zones up; lockfiles, documentation, tests and comment- or import-only edits down) until an agent judges the consequence.
import path from 'node:path'

import { isDocumentPath, isLockfilePath, isTestPath } from './changed-paths.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { RiskLevel } from './guide-shapes.js'
import type { InventoryUnit } from './inventory.js'

export type DraftFacts = {
	readonly units: readonly InventoryUnit[]
	readonly files: readonly string[]
}

const SHOWN_NAMES = 3
const SHOWN_FILES = 4
const SUMMARY_NAMES = 12
const PLACE_SEGMENTS = 2
const MIN_PLACE_DEPTH = 3

// The zones where a slip ships or leaks: named in the consequence, ranked high until judged.
const SENSITIVE_ZONES: readonly { pattern: RegExp; zone: string }[] = [
	{ pattern: /(^|\/)migrations?\//i, zone: 'database migrations' },
	{ pattern: /(^|\/)\.github\/workflows\//, zone: 'CI workflows' },
	{
		pattern: /(^|\/)(auth|oauth|sessions?|permissions?|acl)[./-]/i,
		zone: 'authentication and access',
	},
	{ pattern: /(^|\/)\.env|secrets?[./-]/i, zone: 'secrets and environment' },
	{ pattern: /payments?|billing|stripe/i, zone: 'payments' },
	{
		pattern: /(^|\/)(Dockerfile|docker-compose[^/]*)$|\.tf(vars)?$/,
		zone: 'infrastructure',
	},
]

export function pathsOf(facts: DraftFacts): string[] {
	return [...new Set([...facts.units.map(unit => unit.path), ...facts.files])]
}

function isTrivial(facts: DraftFacts): boolean {
	return (
		!facts.files.length &&
		facts.units.length > 0 &&
		facts.units.every(unit => Boolean(unit.trivia))
	)
}

export function isLockfiles(facts: DraftFacts): boolean {
	return pathsOf(facts).every(isLockfilePath)
}

export function isDocuments(facts: DraftFacts): boolean {
	return pathsOf(facts).every(isDocumentPath)
}

export function sensitiveZones(facts: DraftFacts): string[] {
	const paths = pathsOf(facts)
	return SENSITIVE_ZONES.filter(({ pattern }) =>
		paths.some(filePath => pattern.test(filePath)),
	).map(({ zone }) => zone)
}

export function riskPrior(facts: DraftFacts): RiskLevel {
	const paths = pathsOf(facts)
	if (sensitiveZones(facts).length) return 'high'
	if (isLockfiles(facts) || isDocuments(facts) || isTrivial(facts))
		return 'low'
	if (paths.every(isTestPath)) return 'low'
	return 'medium'
}

// The changed declarations, most-changed first.
export function changedNames(facts: DraftFacts): string[] {
	const counts = new Map<string, number>()
	for (const unit of facts.units)
		if (unit.symbol)
			counts.set(
				unit.symbol.name,
				(counts.get(unit.symbol.name) ?? 0) + 1,
			)
	return [...counts]
		.toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([name]) => name)
}

function listed(names: readonly string[], shown: number): string {
	const more = names.length - shown
	const head = names.slice(0, shown).join(', ')
	return more > 0 ? `${head} +${more}` : head
}

function clipped(sentence: string, max: number): string {
	return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1)}…`
}

// The deepest folder every path shares, by its last segments; the file itself when there is one.
export function placeOf(paths: readonly string[]): string {
	const [first] = paths
	if (!first) return ''
	if (paths.length === 1) return path.posix.basename(first)
	const segments = path.posix.dirname(first).split('/')
	let depth = segments.length
	while (
		depth > 0 &&
		!paths.every(filePath =>
			`${path.posix.dirname(filePath)}/`.startsWith(
				`${segments.slice(0, depth).join('/')}/`,
			),
		)
	)
		depth--
	// A shallow common folder (the repo root, `packages`) says nothing a reader can use.
	if (depth < MIN_PLACE_DEPTH) return ''
	return segments.slice(Math.max(0, depth - PLACE_SEGMENTS), depth).join('/')
}

export function draftTitle(facts: DraftFacts): string {
	const paths = pathsOf(facts)
	if (isLockfiles(facts))
		return clipped(
			`Lockfile updates: ${listed(
				paths.map(filePath => path.posix.basename(filePath)),
				SHOWN_NAMES,
			)}`,
			GUIDE_LIMITS.labelChars,
		)
	const names = changedNames(facts)
	const place = placeOf(paths)
	const what = names.length
		? listed(names, SHOWN_NAMES)
		: listed(
				paths.map(filePath => path.posix.basename(filePath)),
				SHOWN_NAMES,
			)
	const title = place && names.length ? `${place} · ${what}` : what
	return clipped(title || 'Changes', GUIDE_LIMITS.labelChars)
}

function lineCounts(facts: DraftFacts): { added: number; removed: number } {
	return facts.units.reduce(
		(sum, unit) => ({
			added: sum.added + unit.added,
			removed: sum.removed + unit.removed,
		}),
		{ added: 0, removed: 0 },
	)
}

export function draftSummary(facts: DraftFacts): string {
	const paths = pathsOf(facts)
	const { added, removed } = lineCounts(facts)
	const blocks = facts.units.length
		? `${facts.units.length} changed blocks (+${added} -${removed})`
		: ''
	const operations = facts.files.length
		? `${facts.files.length} file operations`
		: ''
	const scope = [blocks, operations].filter(Boolean).join(' and ')
	if (isLockfiles(facts))
		return clipped(
			`Dependency resolution written by the package manager: ${scope} in ${listed(paths, SHOWN_FILES)}.`,
			GUIDE_LIMITS.textChars,
		)
	const names = changedNames(facts)
	const declared = names.length
		? ` Changed declarations: ${listed(names, SUMMARY_NAMES)}.`
		: ''
	return clipped(
		`Drafted from the code's structure, not explained yet: ${scope} in ${listed(paths, SHOWN_FILES)}.${declared}`,
		GUIDE_LIMITS.textChars,
	)
}

export function draftConsequence(facts: DraftFacts): string {
	if (isLockfiles(facts))
		return 'Every install gets the versions pinned here; a resolution that drifts from the manifests ships dependencies nobody reviewed.'
	const zones = sensitiveZones(facts)
	if (zones.length) return `Not assessed yet; touches ${zones.join(', ')}.`
	return 'Not assessed yet.'
}
