// One domain of the guide: its head (identity, risk, consequence), its links to other domains, what it owns, what it points at and how it explains itself.
import { parseBlock } from './guide-blocks.js'
import {
	identifier,
	list,
	oneOf,
	optionalList,
	optionalNumber,
	optionalText,
	record,
	text,
	textList,
	uniqueIds,
} from './guide-parse.js'
import { parseRefIds } from './guide-refs.js'
import { GUIDE_LIMITS, RISK_LEVELS } from './guide-shapes.js'
import { parseMember, parseReference, parseRelated } from './guide-targets.js'

import type { Parsed } from './guide-parse.js'
import type {
	ExplanationBlock,
	GuideDomain,
	GuideEvidence,
	GuideReference,
} from './guide-shapes.js'

type DomainHead = Pick<
	GuideDomain,
	'id' | 'title' | 'risk' | 'consequence' | 'summary' | 'verify' | 'order'
>

function parseDomainHead(
	raw: Record<string, unknown>,
	where: string,
): Parsed<DomainHead> {
	const id = identifier(raw.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const title = text(raw.title, `${where}.title`, GUIDE_LIMITS.labelChars)
	if (!title.ok) return title
	const risk = oneOf(raw.risk, `${where}.risk`, RISK_LEVELS)
	if (!risk.ok) return risk
	const consequence = text(
		raw.consequence,
		`${where}.consequence`,
		GUIDE_LIMITS.textChars,
	)
	if (!consequence.ok) return consequence
	const summary = text(
		raw.summary,
		`${where}.summary`,
		GUIDE_LIMITS.textChars,
	)
	if (!summary.ok) return summary
	const verify = optionalText(
		raw.verify,
		`${where}.verify`,
		GUIDE_LIMITS.textChars,
	)
	if (!verify.ok) return verify
	const order = optionalNumber(raw.order, `${where}.order`)
	if (!order.ok) return order
	return {
		ok: true,
		value: {
			id: id.value,
			title: title.value,
			risk: risk.value,
			consequence: consequence.value,
			summary: summary.value,
			verify: verify.value,
			order: order.value,
		},
	}
}

type DomainLinks = Pick<GuideDomain, 'prerequisites' | 'related' | 'unknowns'>

function parseDomainLinks(
	raw: Record<string, unknown>,
	where: string,
): Parsed<DomainLinks> {
	const prerequisites = optionalList(
		raw.prerequisites,
		`${where}.prerequisites`,
		GUIDE_LIMITS.domains,
		(entry, entryWhere) =>
			identifier(entry, entryWhere, GUIDE_LIMITS.idChars),
	)
	if (!prerequisites.ok) return prerequisites
	const related = optionalList(
		raw.related,
		`${where}.related`,
		GUIDE_LIMITS.domains,
		parseRelated,
	)
	if (!related.ok) return related
	const unknowns = textList(
		raw.unknowns,
		`${where}.unknowns`,
		GUIDE_LIMITS.blocksPerDomain,
		GUIDE_LIMITS.textChars,
	)
	if (!unknowns.ok) return unknowns
	return {
		ok: true,
		value: {
			prerequisites: prerequisites.value,
			related: related.value,
			unknowns: unknowns.value,
		},
	}
}

function parseEvidence(
	raw: unknown,
	where: string,
	refIds: ReadonlySet<string>,
): Parsed<GuideEvidence> {
	const evidence = record(raw, where)
	if (!evidence.ok) return evidence
	const body = text(
		evidence.value.text,
		`${where}.text`,
		GUIDE_LIMITS.textChars,
	)
	if (!body.ok) return body
	const refs = parseRefIds(evidence.value.refs, `${where}.refs`, { refIds })
	if (!refs.ok) return refs
	return { ok: true, value: { text: body.value, refs: refs.value } }
}

// The references first, unique by id: evidence and blocks may only name a declared one.
function parseReferences(
	raw: unknown,
	where: string,
): Parsed<{
	references: GuideReference[] | undefined
	refIds: ReadonlySet<string>
}> {
	const references = optionalList(
		raw,
		where,
		GUIDE_LIMITS.referencesPerDomain,
		parseReference,
	)
	if (!references.ok) return references
	const ids = (references.value ?? []).map(reference => reference.id)
	const unique = uniqueIds(ids, where)
	if (!unique.ok) return unique
	return {
		ok: true,
		value: { references: references.value, refIds: new Set(ids) },
	}
}

type DomainBody = Pick<
	GuideDomain,
	'members' | 'references' | 'evidence' | 'blocks'
>

function parseDomainBody(
	raw: Record<string, unknown>,
	where: string,
): Parsed<DomainBody> {
	const members = list(
		raw.members,
		`${where}.members`,
		{ min: 1, max: GUIDE_LIMITS.membersPerDomain },
		parseMember,
	)
	if (!members.ok) return members
	const references = parseReferences(raw.references, `${where}.references`)
	if (!references.ok) return references
	const { refIds } = references.value
	const evidence = optionalList(
		raw.evidence,
		`${where}.evidence`,
		GUIDE_LIMITS.blocksPerDomain,
		(entry, entryWhere) => parseEvidence(entry, entryWhere, refIds),
	)
	if (!evidence.ok) return evidence
	const blocks = parseBlocks(raw.blocks, `${where}.blocks`, refIds)
	if (!blocks.ok) return blocks
	return {
		ok: true,
		value: {
			members: members.value,
			references: references.value.references,
			evidence: evidence.value,
			blocks: blocks.value,
		},
	}
}

function parseBlocks(
	raw: unknown,
	where: string,
	refIds: ReadonlySet<string>,
): Parsed<ExplanationBlock[]> {
	const blocks = list(
		raw,
		where,
		{ min: 0, max: GUIDE_LIMITS.blocksPerDomain },
		(entry, entryWhere) => parseBlock(entry, entryWhere, { refIds }),
	)
	if (!blocks.ok) return blocks
	const unique = uniqueIds(
		blocks.value.map(block => block.id),
		where,
	)
	if (!unique.ok) return unique
	return blocks
}

export function parseDomain(raw: unknown, where: string): Parsed<GuideDomain> {
	const domain = record(raw, where)
	if (!domain.ok) return domain
	const head = parseDomainHead(domain.value, where)
	if (!head.ok) return head
	const links = parseDomainLinks(domain.value, where)
	if (!links.ok) return links
	const body = parseDomainBody(domain.value, where)
	if (!body.ok) return body
	return {
		ok: true,
		value: { ...head.value, ...links.value, ...body.value },
	}
}
