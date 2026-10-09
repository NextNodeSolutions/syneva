import { asBoolean, asNumber, asOneOf, asString, isObject } from './dto.js'

import type {
	DomainCodeRef,
	DomainComment,
	DomainTarget,
} from '../../../domain/review.js'
import type { Raw } from './dto.js'

// The persisted shape of a guide thread, decoded field by field and encoded back through the same allowlist (review-file-dto.ts does the same for line comments): a malformed thread is dropped, never half-loaded.

function decodeCodeRef(raw: unknown): DomainCodeRef | null {
	if (!isObject(raw)) return null
	const path = asString(raw.path)
	const side = asOneOf(raw.side, ['additions', 'deletions'] as const)
	const lineNumber = asNumber(raw.lineNumber)
	if (path === null || side === null || lineNumber === null) return null
	return {
		path,
		side,
		lineNumber,
		endLine: asNumber(raw.endLine) ?? undefined,
		label: asString(raw.label) ?? undefined,
	}
}

function decodeTarget(raw: unknown): DomainTarget | null {
	if (!isObject(raw) || !Array.isArray(raw.refs)) return null
	const guideFingerprint = asString(raw.guideFingerprint)
	const domainId = asString(raw.domainId)
	const domainTitle = asString(raw.domainTitle)
	if (guideFingerprint === null || domainId === null || domainTitle === null)
		return null
	const refs: DomainCodeRef[] = []
	for (const entry of raw.refs) {
		const ref = decodeCodeRef(entry)
		if (ref !== null) refs.push(ref)
	}
	return {
		guideFingerprint,
		domainId,
		blockId: asString(raw.blockId) ?? undefined,
		domainTitle,
		blockTitle: asString(raw.blockTitle) ?? undefined,
		refs,
	}
}

export function decodeDomainComment(raw: unknown): DomainComment | null {
	if (!isObject(raw)) return null
	const id = asString(raw.id)
	const body = asString(raw.body)
	const createdAt = asString(raw.createdAt)
	const updatedAt = asString(raw.updatedAt)
	const status = asOneOf(raw.status, ['open', 'resolved', 'stale'] as const)
	const target = decodeTarget(raw.target)
	if (id === null || body === null || createdAt === null) return null
	if (updatedAt === null || status === null || target === null) return null
	return {
		id,
		target,
		body,
		createdAt,
		updatedAt,
		status,
		intent:
			asOneOf(raw.intent, ['note', 'action', 'question'] as const) ??
			undefined,
		role: asOneOf(raw.role, ['user', 'agent'] as const) ?? undefined,
		unanchored: asBoolean(raw.unanchored) ?? undefined,
	}
}

export function encodeDomainComment(comment: DomainComment): Raw {
	return {
		id: comment.id,
		target: {
			guideFingerprint: comment.target.guideFingerprint,
			domainId: comment.target.domainId,
			blockId: comment.target.blockId,
			domainTitle: comment.target.domainTitle,
			blockTitle: comment.target.blockTitle,
			refs: comment.target.refs.map(ref => ({
				path: ref.path,
				side: ref.side,
				lineNumber: ref.lineNumber,
				endLine: ref.endLine,
				label: ref.label,
			})),
		},
		body: comment.body,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
		status: comment.status,
		intent: comment.intent,
		role: comment.role,
		unanchored: comment.unanchored,
	}
}
