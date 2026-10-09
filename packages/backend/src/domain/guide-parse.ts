// The field readers every guide validator shares: each failure names the field it refused and what it wanted, so an agent fixes the guide from the message alone.

export type Parsed<T> = { ok: true; value: T } | { ok: false; reason: string }

export function fail(reason: string): { ok: false; reason: string } {
	return { ok: false, reason }
}

// The one entry gate from untyped JSON onto a typed record. A generic runtime guard is a deliberate low-level exception here: this is the guide validator's decode primitive, and the field readers below do the schema validation field by field.
// oxlint-disable-next-line nextnode/no-generic-runtime-guard
export function isRecord(raw: unknown): raw is Record<string, unknown> {
	return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
}

// An optional field left out (or written null): the readers below keep it absent instead of refusing it.
function isAbsent(raw: unknown): raw is undefined | null {
	return raw === null || typeof raw === 'undefined'
}

export function record(
	raw: unknown,
	where: string,
): Parsed<Record<string, unknown>> {
	if (!isRecord(raw)) return fail(`${where} must be an object`)
	return { ok: true, value: raw }
}

// Nothing an agent writes is silently ignored: a key its object does not declare is refused by name, so a typo in an optional field (verfy for verify) cannot drop it.
export function onlyKeys(
	raw: Record<string, unknown>,
	where: string,
	allowed: readonly string[],
): Parsed<true> {
	const stray = Object.keys(raw).find(key => !allowed.includes(key))
	if (typeof stray === 'string')
		return fail(
			`${where}.${stray} is not a field here (the fields are ${allowed.join(', ')})`,
		)
	return { ok: true, value: true }
}

// Required text: present, non-blank, within `max` characters.
export function text(raw: unknown, where: string, max: number): Parsed<string> {
	if (typeof raw !== 'string' || !raw.trim())
		return fail(`${where} must be a non-empty string`)
	if (raw.length > max)
		return fail(`${where} is ${raw.length} characters; at most ${max}`)
	return { ok: true, value: raw }
}

export function optionalText(
	raw: unknown,
	where: string,
	max: number,
): Parsed<string | undefined> {
	if (isAbsent(raw)) return { ok: true, value: undefined }
	return text(raw, where, max)
}

// An identity: non-blank, bounded, and made of characters that survive a URL, a data attribute and a CLI flag.
const ID_SHAPE = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/

export function identifier(
	raw: unknown,
	where: string,
	max: number,
): Parsed<string> {
	const parsed = text(raw, where, max)
	if (!parsed.ok) return parsed
	if (!ID_SHAPE.test(parsed.value))
		return fail(
			`${where} must start with a letter or digit and use only letters, digits, ".", "_", ":" or "-"`,
		)
	return parsed
}

export function positiveInteger(raw: unknown, where: string): Parsed<number> {
	if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1)
		return fail(`${where} must be a positive integer`)
	return { ok: true, value: raw }
}

export function optionalPositiveInteger(
	raw: unknown,
	where: string,
): Parsed<number | undefined> {
	if (isAbsent(raw)) return { ok: true, value: undefined }
	return positiveInteger(raw, where)
}

export function optionalNumber(
	raw: unknown,
	where: string,
): Parsed<number | undefined> {
	if (isAbsent(raw)) return { ok: true, value: undefined }
	if (typeof raw !== 'number' || !Number.isFinite(raw))
		return fail(`${where} must be a finite number`)
	return { ok: true, value: raw }
}

export function optionalBoolean(
	raw: unknown,
	where: string,
): Parsed<boolean | undefined> {
	if (isAbsent(raw)) return { ok: true, value: undefined }
	if (typeof raw !== 'boolean') return fail(`${where} must be true or false`)
	return { ok: true, value: raw }
}

export function oneOf<T extends string>(
	raw: unknown,
	where: string,
	allowed: readonly T[],
): Parsed<T> {
	const found = allowed.find(option => option === raw)
	if (!found) return fail(`${where} must be one of ${allowed.join(', ')}`)
	return { ok: true, value: found }
}

export type ListBounds = { min: number; max: number }

// A bounded array, each entry parsed in turn with its index in the field name; `min` 0 admits an empty list.
export function list<T>(
	raw: unknown,
	where: string,
	bounds: ListBounds,
	parse: (entry: unknown, entryWhere: string) => Parsed<T>,
): Parsed<T[]> {
	if (!Array.isArray(raw)) return fail(`${where} must be an array`)
	if (raw.length < bounds.min)
		return fail(`${where} must list at least ${bounds.min}`)
	if (raw.length > bounds.max)
		return fail(`${where} lists ${raw.length}; at most ${bounds.max}`)
	const values: T[] = []
	for (const [index, entry] of raw.entries()) {
		const parsed = parse(entry, `${where}[${index}]`)
		if (!parsed.ok) return parsed
		values.push(parsed.value)
	}
	return { ok: true, value: values }
}

// Absent stays absent; present parses as a list.
export function optionalList<T>(
	raw: unknown,
	where: string,
	max: number,
	parse: (entry: unknown, entryWhere: string) => Parsed<T>,
): Parsed<T[] | undefined> {
	if (isAbsent(raw)) return { ok: true, value: undefined }
	return list(raw, where, { min: 0, max }, parse)
}

export function textList(
	raw: unknown,
	where: string,
	max: number,
	charLimit: number,
): Parsed<string[] | undefined> {
	return optionalList(raw, where, max, (entry, entryWhere) =>
		text(entry, entryWhere, charLimit),
	)
}

// Every id once: the second occurrence is named.
export function uniqueIds(
	ids: readonly string[],
	where: string,
): { ok: true } | { ok: false; reason: string } {
	const seen = new Set<string>()
	for (const id of ids) {
		if (seen.has(id)) return fail(`${where} repeats the id "${id}"`)
		seen.add(id)
	}
	return { ok: true }
}
