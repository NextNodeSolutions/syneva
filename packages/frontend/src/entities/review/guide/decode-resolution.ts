import {
	assertObject,
	enumValue,
	optString,
	requiredString,
	requiredStringArray,
	requiredArray,
} from '@shared/api/decode'

import type {
	DomainResolution,
	GuideResolution,
	ResolvedReference,
} from './model'

type Ctx = { endpoint: string }

const STATUSES = ['resolved', 'stale', 'unresolved'] as const

function decodeReference(raw: unknown, ctx: Ctx): ResolvedReference {
	const o = assertObject(raw, ctx.endpoint, 'resolved reference')
	return {
		status: enumValue(o.status, ctx.endpoint, STATUSES, 'reference.status'),
		contentHash: optString(o, 'contentHash', ctx.endpoint),
		reason: optString(o, 'reason', ctx.endpoint),
	}
}

function decodeStale(
	o: Record<string, unknown>,
	ctx: Ctx,
): DomainResolution['stale'] {
	if (!o.stale) return undefined
	const stale = assertObject(o.stale, ctx.endpoint, 'stale')
	return { reasons: requiredStringArray(stale, 'reasons', ctx.endpoint) }
}

function decodeDomain(raw: unknown, ctx: Ctx): DomainResolution {
	const o = assertObject(raw, ctx.endpoint, 'domain resolution')
	const refs = assertObject(o.refs, ctx.endpoint, 'refs')
	return {
		units: requiredArray(o, 'units', ctx.endpoint).map(entry => {
			const unit = assertObject(entry, ctx.endpoint, 'owned unit')
			return {
				key: requiredString(unit, 'key', ctx.endpoint),
				contentHash: requiredString(unit, 'contentHash', ctx.endpoint),
			}
		}),
		files: requiredStringArray(o, 'files', ctx.endpoint),
		refs: Object.fromEntries(
			Object.entries(refs).map(([id, entry]) => [
				id,
				decodeReference(entry, ctx),
			]),
		),
		stale: decodeStale(o, ctx),
	}
}

export function decodeGuideResolution(raw: unknown, ctx: Ctx): GuideResolution {
	const o = assertObject(raw, ctx.endpoint, 'guide resolution')
	const domains = assertObject(o.domains, ctx.endpoint, 'domains')
	const unassigned = assertObject(o.unassigned, ctx.endpoint, 'unassigned')
	return {
		fingerprint: requiredString(o, 'fingerprint', ctx.endpoint),
		domains: Object.fromEntries(
			Object.entries(domains).map(([id, entry]) => [
				id,
				decodeDomain(entry, ctx),
			]),
		),
		unassigned: {
			units: requiredStringArray(unassigned, 'units', ctx.endpoint),
			files: requiredStringArray(unassigned, 'files', ctx.endpoint),
		},
	}
}
