import {
	assertObject,
	enumValue,
	optBoolean,
	optNumber,
	optString,
	requiredArray,
	requiredNumber,
	requiredString,
	DecodeError,
} from '@shared/api/decode'
import { RISK_ORDER } from '@syneva/contracts/guide'

import { decodeBlock } from './decode-blocks'
import { optList, optStrings } from './decode-fields'

import type {
	CodeSpan,
	Guide,
	GuideDomain,
	GuideMember,
	GuideReference,
	GuideSource,
} from './model'

// The guide's wire shape onto the entity model, field by field like every other DTO; the hub admitted it with the full validator, so this boundary checks types and names, not the semantic rules.

type Ctx = { endpoint: string }

const MODES = ['repo', 'file', 'pr'] as const
const SIDES = ['additions', 'deletions'] as const
const REFERENCE_ROLES = ['changed', 'context'] as const

function decodeSpan(
	o: Record<string, unknown>,
	ctx: Ctx,
	what: string,
): CodeSpan {
	return {
		path: requiredString(o, 'path', ctx.endpoint),
		side: enumValue(o.side, ctx.endpoint, SIDES, `${what}.side`),
		lineNumber: requiredNumber(o, 'lineNumber', ctx.endpoint),
		endLine: optNumber(o, 'endLine', ctx.endpoint),
	}
}

function decodeMember(raw: unknown, ctx: Ctx): GuideMember {
	const o = assertObject(raw, ctx.endpoint, 'guide member')
	if (o.kind === 'file')
		return { kind: 'file', path: requiredString(o, 'path', ctx.endpoint) }
	if (o.kind !== 'change')
		throw new DecodeError(
			'guide member.kind must be change or file',
			ctx.endpoint,
		)
	return { kind: 'change', ...decodeSpan(o, ctx, 'guide member') }
}

function decodeReference(raw: unknown, ctx: Ctx): GuideReference {
	const o = assertObject(raw, ctx.endpoint, 'guide reference')
	return {
		...decodeSpan(o, ctx, 'guide reference'),
		id: requiredString(o, 'id', ctx.endpoint),
		role: enumValue(
			o.role,
			ctx.endpoint,
			REFERENCE_ROLES,
			'guide reference.role',
		),
		label: optString(o, 'label', ctx.endpoint),
	}
}

function decodeDomainLinks(
	o: Record<string, unknown>,
	ctx: Ctx,
): Pick<GuideDomain, 'prerequisites' | 'related' | 'evidence' | 'unknowns'> {
	return {
		prerequisites: optStrings(o, 'prerequisites', ctx),
		related: optList(o, 'related', ctx, entry => {
			const link = assertObject(entry, ctx.endpoint, 'related domain')
			return {
				domainId: requiredString(link, 'domainId', ctx.endpoint),
				note: optString(link, 'note', ctx.endpoint),
			}
		}),
		evidence: optList(o, 'evidence', ctx, entry => {
			const claim = assertObject(entry, ctx.endpoint, 'evidence')
			return {
				text: requiredString(claim, 'text', ctx.endpoint),
				refs: optStrings(claim, 'refs', ctx),
			}
		}),
		unknowns: optStrings(o, 'unknowns', ctx),
	}
}

function decodeDomain(raw: unknown, ctx: Ctx): GuideDomain {
	const o = assertObject(raw, ctx.endpoint, 'guide domain')
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		title: requiredString(o, 'title', ctx.endpoint),
		risk: enumValue(o.risk, ctx.endpoint, RISK_ORDER, 'guide domain.risk'),
		consequence: requiredString(o, 'consequence', ctx.endpoint),
		summary: requiredString(o, 'summary', ctx.endpoint),
		verify: optString(o, 'verify', ctx.endpoint),
		...decodeDomainLinks(o, ctx),
		members: requiredArray(o, 'members', ctx.endpoint).map(entry =>
			decodeMember(entry, ctx),
		),
		references: optList(o, 'references', ctx, entry =>
			decodeReference(entry, ctx),
		),
		blocks: requiredArray(o, 'blocks', ctx.endpoint).map(entry =>
			decodeBlock(entry, ctx),
		),
		order: optNumber(o, 'order', ctx.endpoint),
	}
}

// A null head (no commit yet) is a value of its own, not an absent field.
function decodeHead(
	o: Record<string, unknown>,
	ctx: Ctx,
): string | null | undefined {
	if (o.head === null) return null
	return optString(o, 'head', ctx.endpoint)
}

function decodeSource(raw: unknown, ctx: Ctx): GuideSource {
	const o = assertObject(raw, ctx.endpoint, 'guide source')
	return {
		mode: enumValue(o.mode, ctx.endpoint, MODES, 'guide source.mode'),
		fingerprint: requiredString(o, 'fingerprint', ctx.endpoint),
		head: decodeHead(o, ctx),
		base: optString(o, 'base', ctx.endpoint),
		staged: optBoolean(o, 'staged', ctx.endpoint),
		path: optString(o, 'path', ctx.endpoint),
	}
}

export function decodeGuide(raw: unknown, ctx: Ctx): Guide {
	const o = assertObject(raw, ctx.endpoint, 'guide')
	if (o.format !== 'syneva-guide/2')
		throw new DecodeError(
			'guide.format is not syneva-guide/2',
			ctx.endpoint,
		)
	return {
		format: 'syneva-guide/2',
		source: decodeSource(o.source, ctx),
		overview: requiredString(o, 'overview', ctx.endpoint),
		domains: requiredArray(o, 'domains', ctx.endpoint).map(entry =>
			decodeDomain(entry, ctx),
		),
		baseDiffHash: optString(o, 'baseDiffHash', ctx.endpoint),
	}
}
