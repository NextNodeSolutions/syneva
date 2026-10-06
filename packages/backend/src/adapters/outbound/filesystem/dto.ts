// Every decoded value comes from one of these allowlist decoders - never cast - so unknown or malformed JSON can never enter the live review state.
// The format is frozen: newer runs read older files (missing optionals decode to defaults), older runs keep reading newer records (unknown fields dropped).
// Required-field decoders return null (not undefined) on absence/wrong kind, so legitimate falsy values (empty string, 0) stay distinguishable from absence.

export type Raw = Record<string, unknown>

// The one entry gate from untyped JSON onto a typed record. A generic runtime guard is a deliberate low-level exception here: this is the storage DTO's decode primitive, and the allowlist decoders below do the schema validation field by field.
// oxlint-disable-next-line nextnode/no-generic-runtime-guard
export function isObject(raw: unknown): raw is Raw {
	return typeof raw === 'object' && raw !== null
}

export function asString(raw: unknown): string | null {
	if (typeof raw === 'string') return raw
	return null
}

export function asNumber(raw: unknown): number | null {
	if (typeof raw === 'number' && Number.isFinite(raw)) return raw
	return null
}

export function asBoolean(raw: unknown): boolean | null {
	if (typeof raw === 'boolean') return raw
	return null
}

export function asOneOf<T extends string>(
	raw: unknown,
	allowed: readonly T[],
): T | null {
	return allowed.find(option => option === raw) ?? null
}
