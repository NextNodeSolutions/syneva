import { asOneOf, asString, isObject } from './dto.js'

import type {
	DomainResolution,
	GuideResolution,
	ResolvedReference,
} from '../../../domain/guide-shapes.js'
import type { Raw } from './dto.js'

// The guide resolution's storage DTO: decoded field by field like every persisted record; a malformed resolution decodes to nothing, and the next reload rebuilds it from the guide.

function decodeStrings(raw: unknown): string[] | null {
	if (!Array.isArray(raw)) return null
	const values: string[] = []
	for (const entry of raw) {
		const text = asString(entry)
		if (text === null) return null
		values.push(text)
	}
	return values
}

function decodeReference(raw: unknown): ResolvedReference | null {
	if (!isObject(raw)) return null
	const status = asOneOf(raw.status, [
		'resolved',
		'stale',
		'unresolved',
	] as const)
	if (status === null) return null
	return {
		status,
		contentHash: asString(raw.contentHash) ?? undefined,
		reason: asString(raw.reason) ?? undefined,
	}
}

function decodeUnits(raw: unknown): DomainResolution['units'] | null {
	if (!Array.isArray(raw)) return null
	const units: DomainResolution['units'] = []
	for (const entry of raw) {
		if (!isObject(entry)) return null
		const key = asString(entry.key)
		const contentHash = asString(entry.contentHash)
		if (key === null || contentHash === null) return null
		units.push({ key, contentHash })
	}
	return units
}

function decodeDomain(raw: unknown): DomainResolution | null {
	if (!isObject(raw) || !isObject(raw.refs)) return null
	const units = decodeUnits(raw.units)
	const files = decodeStrings(raw.files)
	if (units === null || files === null) return null
	const refs: Record<string, ResolvedReference> = {}
	for (const [id, entry] of Object.entries(raw.refs)) {
		const reference = decodeReference(entry)
		if (reference === null) return null
		refs[id] = reference
	}
	const reasons = isObject(raw.stale)
		? decodeStrings(raw.stale.reasons)
		: null
	return { units, files, refs, stale: reasons ? { reasons } : undefined }
}

export function decodeGuideResolution(raw: unknown): GuideResolution | null {
	if (!isObject(raw) || !isObject(raw.domains) || !isObject(raw.unassigned))
		return null
	const fingerprint = asString(raw.fingerprint)
	const units = decodeStrings(raw.unassigned.units)
	const files = decodeStrings(raw.unassigned.files)
	if (fingerprint === null || units === null || files === null) return null
	const domains: Record<string, DomainResolution> = {}
	for (const [id, entry] of Object.entries(raw.domains)) {
		const domain = decodeDomain(entry)
		if (domain === null) return null
		domains[id] = domain
	}
	return { fingerprint, domains, unassigned: { units, files } }
}

// Decoded by the allowlist above and holding nothing else, the record is written whole; JSON.stringify drops undefined-valued keys.
export function encodeGuideResolution(resolution: GuideResolution): Raw {
	return { ...resolution }
}
