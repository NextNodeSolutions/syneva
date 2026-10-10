import type { DomainCodeRef, DomainComment } from '../../../domain/review.js'

// The domainComments slice of a reviewer save, shaped field by field like reviewer-save.ts shapes the line comments: a malformed thread refuses the whole save (null) rather than entering the state half-read.

// oxlint-disable-next-line nextnode/no-generic-runtime-guard -- the DTO decode primitive; the field decoders below do the schema validation
function isRecord(raw: unknown): raw is Record<string, unknown> {
	return typeof raw === 'object' && raw !== null
}

function text(raw: unknown): string | null {
	if (typeof raw !== 'string') return null
	return raw
}

function optionalText(raw: unknown): string | undefined {
	if (typeof raw !== 'string' || !raw) return undefined
	return raw
}

function side(raw: unknown): DomainCodeRef['side'] | null {
	if (raw === 'additions' || raw === 'deletions') return raw
	return null
}

function status(raw: unknown): DomainComment['status'] | null {
	if (raw === 'open' || raw === 'resolved' || raw === 'stale') return raw
	return null
}

function codeRef(raw: unknown): DomainCodeRef | null {
	if (!isRecord(raw)) return null
	const path = text(raw.path)
	const refSide = side(raw.side)
	const lineNumber =
		typeof raw.lineNumber === 'number' && Number.isFinite(raw.lineNumber)
			? raw.lineNumber
			: null
	if (path === null || refSide === null || lineNumber === null) return null
	const endLine =
		typeof raw.endLine === 'number' && Number.isFinite(raw.endLine)
			? raw.endLine
			: undefined
	return {
		path,
		side: refSide,
		lineNumber,
		endLine,
		label: optionalText(raw.label),
	}
}

function target(raw: unknown): DomainComment['target'] | null {
	if (!isRecord(raw) || !Array.isArray(raw.refs)) return null
	const guideFingerprint = text(raw.guideFingerprint)
	const domainId = text(raw.domainId)
	const domainTitle = text(raw.domainTitle)
	if (!guideFingerprint || !domainId || domainTitle === null) return null
	const refs: DomainCodeRef[] = []
	for (const entry of raw.refs) {
		const ref = codeRef(entry)
		if (ref === null) return null
		refs.push(ref)
	}
	return {
		guideFingerprint,
		domainId,
		blockId: optionalText(raw.blockId),
		domainTitle,
		blockTitle: optionalText(raw.blockTitle),
		refs,
	}
}

function domainComment(raw: unknown): DomainComment | null {
	if (!isRecord(raw)) return null
	const id = text(raw.id)
	const body = text(raw.body)
	const createdAt = text(raw.createdAt)
	const updatedAt = text(raw.updatedAt)
	const threadStatus = status(raw.status)
	const threadTarget = target(raw.target)
	if (!id || body === null || !createdAt || !updatedAt) return null
	if (threadStatus === null || threadTarget === null) return null
	return {
		id,
		target: threadTarget,
		body,
		createdAt,
		updatedAt,
		status: threadStatus,
		intent:
			raw.intent === 'note' ||
			raw.intent === 'action' ||
			raw.intent === 'question'
				? raw.intent
				: undefined,
		role:
			raw.role === 'user' || raw.role === 'agent' ? raw.role : undefined,
		unanchored: raw.unanchored === true ? true : undefined,
	}
}

export function parseDomainComments(raw: unknown): DomainComment[] | null {
	if (!Array.isArray(raw)) return null
	const comments: DomainComment[] = []
	for (const entry of raw) {
		const comment = domainComment(entry)
		if (comment === null) return null
		comments.push(comment)
	}
	return comments
}
