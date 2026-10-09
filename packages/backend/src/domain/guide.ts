import { parseDomain } from './guide-domain.js'
import {
	fail,
	isRecord,
	list,
	oneOf,
	optionalBoolean,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { GUIDE_FORMAT, GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'
import type { Guide, GuideDomain, GuideSource } from './guide-shapes.js'

export type GuideValidation =
	| { ok: true; guide: Guide }
	| { ok: false; reason: string }

const MODES = ['repo', 'file', 'pr'] as const

// The schema check alone: the shape, its bounds and its internal identities. Membership, coverage and reference targets are resolved against the review's inventory by the lifecycle (guide-resolve.ts), which needs the diff.
// Pure - the same check server-side and in the CLI; the reason names the field it refused and what it wanted.
export function validateGuide(input: unknown): GuideValidation {
	const parsed = parseGuide(input)
	if (!parsed.ok) return { ok: false, reason: parsed.reason }
	return { ok: true, guide: parsed.value }
}

function parseGuide(input: unknown): Parsed<Guide> {
	if (!isRecord(input)) return fail('guide must be a JSON object')
	if (input.format !== GUIDE_FORMAT)
		return fail(
			`guide.format must be "${GUIDE_FORMAT}" (the file-grouping guide format is no longer accepted)`,
		)
	const source = parseSource(input.source)
	if (!source.ok) return source
	const overview = text(
		input.overview,
		'guide.overview',
		GUIDE_LIMITS.overviewChars,
	)
	if (!overview.ok) return overview
	const domains = list(
		input.domains,
		'guide.domains',
		{ min: 0, max: GUIDE_LIMITS.domains },
		parseDomain,
	)
	if (!domains.ok) return domains
	const links = checkDomainLinks(domains.value)
	if (!links.ok) return links
	const baseDiffHash = optionalText(
		input.baseDiffHash,
		'guide.baseDiffHash',
		GUIDE_LIMITS.idChars,
	)
	if (!baseDiffHash.ok) return baseDiffHash
	return {
		ok: true,
		value: {
			format: GUIDE_FORMAT,
			source: source.value,
			overview: overview.value,
			domains: domains.value,
			baseDiffHash: baseDiffHash.value,
		},
	}
}

function parseSource(raw: unknown): Parsed<GuideSource> {
	const source = record(raw, 'guide.source')
	if (!source.ok) return source
	const mode = oneOf(source.value.mode, 'guide.source.mode', MODES)
	if (!mode.ok) return mode
	const fingerprint = text(
		source.value.fingerprint,
		'guide.source.fingerprint',
		GUIDE_LIMITS.idChars,
	)
	if (!fingerprint.ok) return fingerprint
	const head = optionalText(
		source.value.head,
		'guide.source.head',
		GUIDE_LIMITS.idChars,
	)
	if (!head.ok) return head
	const base = optionalText(
		source.value.base,
		'guide.source.base',
		GUIDE_LIMITS.textChars,
	)
	if (!base.ok) return base
	const staged = optionalBoolean(source.value.staged, 'guide.source.staged')
	if (!staged.ok) return staged
	const path = optionalText(
		source.value.path,
		'guide.source.path',
		GUIDE_LIMITS.textChars,
	)
	if (!path.ok) return path
	return {
		ok: true,
		value: {
			mode: mode.value,
			fingerprint: fingerprint.value,
			head: head.value,
			base: base.value,
			staged: staged.value,
			path: path.value,
		},
	}
}

// Domain ids are the identities feedback and review position key on, so they are unique; prerequisites and related entries name domains in this guide, never themselves.
function checkDomainLinks(domains: readonly GuideDomain[]): Parsed<true> {
	const unique = uniqueIds(
		domains.map(domain => domain.id),
		'guide.domains',
	)
	if (!unique.ok) return unique
	const ids = new Set(domains.map(domain => domain.id))
	for (const [index, domain] of domains.entries()) {
		const links = checkDomainLinksOf(domain, `guide.domains[${index}]`, ids)
		if (!links.ok) return links
	}
	return { ok: true, value: true }
}

function checkDomainLinksOf(
	domain: GuideDomain,
	where: string,
	ids: ReadonlySet<string>,
): Parsed<true> {
	const named = [
		...(domain.prerequisites ?? []).map((id, position) => ({
			id,
			field: `${where}.prerequisites[${position}]`,
		})),
		...(domain.related ?? []).map((link, position) => ({
			id: link.domainId,
			field: `${where}.related[${position}].domainId`,
		})),
	]
	for (const { id, field } of named) {
		if (id === domain.id) return fail(`${field} names the domain itself`)
		if (!ids.has(id))
			return fail(
				`${field} names "${id}", which is not a domain of this guide`,
			)
	}
	return { ok: true, value: true }
}
