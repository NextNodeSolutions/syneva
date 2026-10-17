// A domain's critical spans: the changed code the reviewer must read line by line whatever the explanation draws.
import { GUIDE_KEYS } from './guide-keys.js'
import {
	fail,
	onlyKeys,
	optionalList,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { parseRefId } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'
import type { GuideCritical, GuideReference } from './guide-shapes.js'

// A critical span names one of the domain's `changed` references, once: context code is read-only, so there is nothing there to read line by line.
function parseCritical(
	raw: unknown,
	where: string,
	references: readonly GuideReference[],
): Parsed<GuideCritical> {
	const entry = record(raw, where)
	if (!entry.ok) return entry
	const keys = onlyKeys(entry.value, where, GUIDE_KEYS.critical)
	if (!keys.ok) return keys
	const ref = parseRefId(entry.value.ref, `${where}.ref`, {
		refIds: new Set(references.map(reference => reference.id)),
	})
	if (!ref.ok) return ref
	const target = references.find(reference => reference.id === ref.value)
	if (target?.role !== 'changed')
		return fail(
			`${where}.ref names reference "${ref.value}", a context reference; a critical span is changed code`,
		)
	const why = text(entry.value.why, `${where}.why`, GUIDE_LIMITS.textChars)
	if (!why.ok) return why
	return { ok: true, value: { ref: ref.value, why: why.value } }
}

export function parseCriticalList(
	raw: unknown,
	where: string,
	references: readonly GuideReference[],
): Parsed<GuideCritical[] | undefined> {
	const critical = optionalList(
		raw,
		where,
		GUIDE_LIMITS.criticalPerDomain,
		(entry, entryWhere) => parseCritical(entry, entryWhere, references),
	)
	if (!critical.ok) return critical
	const unique = uniqueIds(
		(critical.value ?? []).map(entry => entry.ref),
		where,
	)
	if (!unique.ok) return unique
	return critical
}
