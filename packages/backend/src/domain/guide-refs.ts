// What a block may point at: the domain's declared references, by id. A dangling ref would render as a link to nowhere, so every block, node and edge ref is checked against this scope.
import { fail, identifier, optionalList } from './guide-parse.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'

export type BlockScope = { refIds: ReadonlySet<string> }

export type BlockBase = {
	id: string
	title?: string | undefined
	refs?: string[] | undefined
	detail?: string | undefined
}

export function parseRefId(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<string> {
	const id = identifier(raw, where, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	if (!scope.refIds.has(id.value))
		return fail(
			`${where} names reference "${id.value}", which the domain's references do not declare`,
		)
	return id
}

export function parseRefIds(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<string[] | undefined> {
	return optionalList(
		raw,
		where,
		GUIDE_LIMITS.referencesPerDomain,
		(entry, entryWhere) => parseRefId(entry, entryWhere, scope),
	)
}

export function parseOptionalRef(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<string | undefined> {
	if (raw === null || typeof raw === 'undefined')
		return { ok: true, value: undefined }
	return parseRefId(raw, where, scope)
}
