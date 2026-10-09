import {
	assertObject,
	enumValue,
	optBoolean,
	optEnum,
	optNumber,
	optString,
	requiredArray,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'

import type { DomainCodeRef, DomainComment, DomainTarget } from './model'

const SIDES = ['additions', 'deletions'] as const
const STATUSES = ['open', 'resolved', 'stale'] as const
const INTENTS = ['note', 'action', 'question'] as const
const ROLES = ['user', 'agent'] as const

type Ctx = { endpoint: string }

function decodeCodeRef(raw: unknown, ctx: Ctx): DomainCodeRef {
	const o = assertObject(raw, ctx.endpoint, 'domain comment ref')
	return {
		path: requiredString(o, 'path', ctx.endpoint),
		side: enumValue(o.side, ctx.endpoint, SIDES, 'ref.side'),
		lineNumber: requiredNumber(o, 'lineNumber', ctx.endpoint),
		endLine: optNumber(o, 'endLine', ctx.endpoint),
		label: optString(o, 'label', ctx.endpoint),
	}
}

function decodeTarget(raw: unknown, ctx: Ctx): DomainTarget {
	const o = assertObject(raw, ctx.endpoint, 'domain comment target')
	return {
		guideFingerprint: requiredString(o, 'guideFingerprint', ctx.endpoint),
		domainId: requiredString(o, 'domainId', ctx.endpoint),
		blockId: optString(o, 'blockId', ctx.endpoint),
		domainTitle: requiredString(o, 'domainTitle', ctx.endpoint),
		blockTitle: optString(o, 'blockTitle', ctx.endpoint),
		refs: requiredArray(o, 'refs', ctx.endpoint, 'refs').map(ref =>
			decodeCodeRef(ref, ctx),
		),
	}
}

export function decodeDomainComment(raw: unknown, ctx: Ctx): DomainComment {
	const o = assertObject(raw, ctx.endpoint, 'domain comment')
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		target: decodeTarget(o.target, ctx),
		body: requiredString(o, 'body', ctx.endpoint),
		createdAt: requiredString(o, 'createdAt', ctx.endpoint),
		updatedAt: requiredString(o, 'updatedAt', ctx.endpoint),
		status: enumValue(o.status, ctx.endpoint, STATUSES, 'status'),
		intent: optEnum(o, 'intent', ctx.endpoint, INTENTS),
		role: optEnum(o, 'role', ctx.endpoint, ROLES),
		unanchored: optBoolean(o, 'unanchored', ctx.endpoint),
	}
}

// Absent on a hub older than the threads: an empty list, never a decode failure.
export function decodeDomainComments(
	o: Record<string, unknown>,
	ctx: Ctx,
): DomainComment[] {
	if (!o.domainComments) return []
	return requiredArray(
		o,
		'domainComments',
		ctx.endpoint,
		'domainComments',
	).map(comment => decodeDomainComment(comment, ctx))
}
