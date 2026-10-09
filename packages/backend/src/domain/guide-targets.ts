// What a domain owns and points at: code spans on an original side, file operations, and the references explanations name.
import {
	fail,
	identifier,
	oneOf,
	optionalPositiveInteger,
	optionalText,
	positiveInteger,
	record,
	text,
} from './guide-parse.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'
import type {
	CodeSpan,
	GuideCrossReference,
	GuideMember,
	GuideReference,
} from './guide-shapes.js'

const SIDES = ['additions', 'deletions'] as const
const REFERENCE_ROLES = ['changed', 'context'] as const
const MEMBER_KINDS = ['change', 'file'] as const

export function parseSpan(
	raw: Record<string, unknown>,
	where: string,
): Parsed<CodeSpan> {
	const path = text(raw.path, `${where}.path`, GUIDE_LIMITS.textChars)
	if (!path.ok) return path
	const side = oneOf(raw.side, `${where}.side`, SIDES)
	if (!side.ok) return side
	const lineNumber = positiveInteger(raw.lineNumber, `${where}.lineNumber`)
	if (!lineNumber.ok) return lineNumber
	const endLine = optionalPositiveInteger(raw.endLine, `${where}.endLine`)
	if (!endLine.ok) return endLine
	if (endLine.value && endLine.value < lineNumber.value)
		return fail(`${where}.endLine must not be before lineNumber`)
	return {
		ok: true,
		value: {
			path: path.value,
			side: side.value,
			lineNumber: lineNumber.value,
			endLine: endLine.value,
		},
	}
}

export function parseMember(raw: unknown, where: string): Parsed<GuideMember> {
	const member = record(raw, where)
	if (!member.ok) return member
	const kind = oneOf(member.value.kind, `${where}.kind`, MEMBER_KINDS)
	if (!kind.ok) return kind
	if (kind.value === 'file') {
		const path = text(
			member.value.path,
			`${where}.path`,
			GUIDE_LIMITS.textChars,
		)
		if (!path.ok) return path
		return { ok: true, value: { kind: 'file', path: path.value } }
	}
	const span = parseSpan(member.value, where)
	if (!span.ok) return span
	return { ok: true, value: { kind: 'change', ...span.value } }
}

export function parseReference(
	raw: unknown,
	where: string,
): Parsed<GuideReference> {
	const reference = record(raw, where)
	if (!reference.ok) return reference
	const id = identifier(
		reference.value.id,
		`${where}.id`,
		GUIDE_LIMITS.idChars,
	)
	if (!id.ok) return id
	const role = oneOf(reference.value.role, `${where}.role`, REFERENCE_ROLES)
	if (!role.ok) return role
	const label = optionalText(
		reference.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const span = parseSpan(reference.value, where)
	if (!span.ok) return span
	return {
		ok: true,
		value: {
			...span.value,
			id: id.value,
			role: role.value,
			label: label.value,
		},
	}
}

export function parseRelated(
	raw: unknown,
	where: string,
): Parsed<GuideCrossReference> {
	const related = record(raw, where)
	if (!related.ok) return related
	const domainId = identifier(
		related.value.domainId,
		`${where}.domainId`,
		GUIDE_LIMITS.idChars,
	)
	if (!domainId.ok) return domainId
	const note = optionalText(
		related.value.note,
		`${where}.note`,
		GUIDE_LIMITS.textChars,
	)
	if (!note.ok) return note
	return { ok: true, value: { domainId: domainId.value, note: note.value } }
}
