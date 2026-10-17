import { parseDomain } from './guide-domain.js'
import { GUIDE_KEYS } from './guide-keys.js'
import { modelLinkIssues } from './guide-model-links.js'
import { parseModel } from './guide-model.js'
import {
	fail,
	isRecord,
	list,
	oneOf,
	onlyKeys,
	optionalBoolean,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { GUIDE_FORMAT, GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'
import type {
	AuthoredDomain,
	AuthoredGuide,
	Guide,
	GuideDomain,
	GuideMember,
	GuideSource,
} from './guide-shapes.js'

export type GuideValidation =
	| { ok: true; guide: AuthoredGuide }
	| { ok: false; reason: string }

export type StoredGuideValidation =
	| { ok: true; guide: Guide }
	| { ok: false; reason: string }

const MODES = ['repo', 'file', 'pr'] as const

// The schema check of a posted guide alone: the shape, its bounds and its internal identities. What it lays over the desk's current guide, its coverage and its reference targets are resolved against the review by the lifecycle (guide-compose.ts, guide-resolve.ts), which needs the diff.
// Pure - the same check server-side and in the CLI; the reason names the field it refused and what it wanted.
export function validateGuide(input: unknown): GuideValidation {
	const parsed = parseGuide(input)
	if (!parsed.ok) return { ok: false, reason: parsed.reason }
	return { ok: true, guide: parsed.value }
}

function isResolvedMember(
	member: NonNullable<AuthoredDomain['members']>[number],
): member is GuideMember {
	return member.kind === 'change' || member.kind === 'file'
}

function resolvedDomain(domain: AuthoredDomain): GuideDomain | null {
	const members = domain.members ?? []
	if (!members.length || !members.every(isResolvedMember)) return null
	return { ...domain, members: members.filter(isResolvedMember) }
}

// A guide as the desk keeps it: every domain owns its blocks by `change` and `file` members, and every domain it links to is one of its own.
export function validateStoredGuide(input: unknown): StoredGuideValidation {
	const parsed = parseGuide(input)
	if (!parsed.ok) return { ok: false, reason: parsed.reason }
	const domains = parsed.value.domains.flatMap(
		domain => resolvedDomain(domain) ?? [],
	)
	if (domains.length !== parsed.value.domains.length)
		return {
			ok: false,
			reason: 'a stored guide lists every domain\'s members as "change" or "file" members',
		}
	const links = checkDomainLinks(domains)
	if (!links.ok) return { ok: false, reason: links.reason }
	const [stranger] = modelLinkIssues(
		parsed.value.model,
		new Set(domains.map(domain => domain.id)),
	)
	if (stranger)
		return { ok: false, reason: `${stranger.field} ${stranger.reason}` }
	return { ok: true, guide: { ...parsed.value, domains } }
}

function parseGuide(input: unknown): Parsed<AuthoredGuide> {
	if (!isRecord(input)) return fail('guide must be a JSON object')
	const keys = onlyKeys(input, 'guide', GUIDE_KEYS.guide)
	if (!keys.ok) return keys
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
	const unique = uniqueIds(
		domains.value.map(domain => domain.id),
		'guide.domains',
	)
	if (!unique.ok) return unique
	const model = parseModel(input.model)
	if (!model.ok) return model
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
			model: model.value,
			baseDiffHash: baseDiffHash.value,
		},
	}
}

function parseSource(raw: unknown): Parsed<GuideSource> {
	const source = record(raw, 'guide.source')
	if (!source.ok) return source
	const keys = onlyKeys(source.value, 'guide.source', GUIDE_KEYS.source)
	if (!keys.ok) return keys
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
