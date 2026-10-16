// The id of a drafted domain, readable and stable for the same changeset: the file that holds a good share of its blocks, else its most-changed declaration, else the file; the lockfiles and the documentation by what they are.
import path from 'node:path'

import { referenceId } from './guide-draft-members.js'
import { isDocuments, isLockfiles } from './guide-draft-text.js'

import type { DraftFacts } from './guide-draft-text.js'

// Names a framework gives every file (route handlers, default exports): they say nothing about the subject.
const GENERIC_NAMES = new Set([
	'default',
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'prerender',
	'handler',
	'main',
	'config',
	'props',
])
// A file holding at least a third of a domain's blocks names it.
const DOMINANT_SHARE = 3
// A file named for its role rather than its subject takes its folder's name too.
const ROLE_STEMS = new Set([
	'index',
	'main',
	'mod',
	'types',
	'utils',
	'constants',
	'readme',
])

// `WalkthroughPage` → `walkthrough-page`, `file_header` → `file-header`.
function slug(text: string): string {
	return text
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace(/[^a-z0-9.:]+/g, '-')
		.replace(/^[^a-z0-9]+|-+$/g, '')
}

function stemOf(filePath: string): string {
	const base = path.posix.basename(filePath)
	const dot = base.indexOf('.')
	return dot <= 0 ? base : base.slice(0, dot)
}

function folderOf(filePath: string): string {
	return path.posix.basename(path.posix.dirname(filePath))
}

// The most-changed declaration that is not a bare call (a `describe(...)` names a test, not a subject).
function leadingDeclaration(facts: DraftFacts): string | undefined {
	const counts = new Map<string, number>()
	for (const unit of facts.units)
		if (
			unit.symbol &&
			unit.symbol.kind !== 'call' &&
			!GENERIC_NAMES.has(unit.symbol.name.toLowerCase())
		)
			counts.set(
				unit.symbol.name,
				(counts.get(unit.symbol.name) ?? 0) + 1,
			)
	const [top] = [...counts].toSorted(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
	)
	return top?.[0]
}

// Named for the file holding a good share of the domain's blocks - its stem, or its folder and stem when the stem names a role (index, types) or is taken - else for its most-changed declaration; the lockfiles and the documentation by what they are.
function idCandidates(
	facts: DraftFacts,
	top: readonly [string, number] | undefined,
): string[] {
	if (isLockfiles(facts)) return ['lockfiles']
	if (isDocuments(facts)) return ['docs']
	if (!top) return ['changes']
	const [topPath, count] = top
	const isDominant =
		count * DOMINANT_SHARE >= facts.units.length + facts.files.length
	const declaration = slug(leadingDeclaration(facts) ?? '')
	const stem = slug(stemOf(topPath))
	const qualified = slug(`${folderOf(topPath)}-${stemOf(topPath)}`)
	const byFile =
		!stem || ROLE_STEMS.has(stem) ? [qualified] : [stem, qualified]
	const ranked = isDominant
		? [...byFile, declaration]
		: [declaration, ...byFile]
	return ranked.filter(Boolean)
}

// A unique id for a drafted domain, never one in `taken` (which it joins).
export function domainId(facts: DraftFacts, taken: Set<string>): string {
	const counts = new Map<string, number>()
	for (const filePath of [
		...facts.units.map(unit => unit.path),
		...facts.files,
	])
		counts.set(filePath, (counts.get(filePath) ?? 0) + 1)
	const [top] = [...counts].toSorted(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
	)
	const candidates = idCandidates(facts, top)
	const free = candidates.find(candidate => !taken.has(candidate))
	return referenceId(free ?? candidates[0] ?? 'changes', taken)
}
