// The review entity's boundary on the hub's stream: a desk's `pulse` (RFC 0001, 4.4), carried raw
// by the hub entity's store, decoded here onto the review's model, and the same pulse read whole
// at GET …/pulse (api.ts fetchPulse). Loaded with the desk's stream, after the first paint, never
// with the page.
import {
	assertObject,
	optBoolean,
	requiredArray,
	requiredString,
} from '@shared/api/decode'
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import { decodeComment, decodeDeskStatus, decodeGuideFields } from './decode'
import { decodeDomainComments } from './decode-domain-comments'
import { ensureGuideDecoders } from './guide/decode-lazy'

import type { DeskPulse, DeskPulseHead, StreamPulse } from './model'

// A payload that does not read names the stream's path, as an HTTP read names its route.
const SOCKET = BRIDGE_PATHS.tabSocket

// A pulse as the stream brings it. A partial one carries only its head beside `partial`: every
// head field is decoded, so a head laid over the whole pulse last read leaves none of its own.
export async function readStreamPulse(raw: unknown): Promise<StreamPulse> {
	const o = assertObject(raw, SOCKET, 'pulse')
	if (!o.partial) return { kind: 'whole', pulse: await readDeskPulse(raw) }
	const partial = assertObject(o.partial, SOCKET, 'partial')
	return {
		kind: 'partial',
		head: decodeHead(o, SOCKET),
		digest: requiredString(partial, 'digest', SOCKET),
	}
}

// A whole pulse, from the stream or from `endpoint` (GET …/pulse). Async: a pulse that carries a
// guide loads the guide's decoders first, as a /state read does.
export async function readDeskPulse(
	raw: unknown,
	endpoint: string = SOCKET,
): Promise<DeskPulse> {
	await ensureGuideDecoders(raw)
	const o = assertObject(raw, endpoint, 'pulse')
	const ctx = { endpoint }
	return {
		...decodeGuideFields(o, ctx),
		...decodeHead(o, endpoint),
		comments: requiredArray(o, 'comments', endpoint, 'comments').map(c =>
			decodeComment(c, ctx),
		),
		domainComments: decodeDomainComments(o, ctx),
	}
}

function decodeHead(
	o: Record<string, unknown>,
	endpoint: string,
): DeskPulseHead {
	return {
		baseDiffHash: requiredString(o, 'baseDiffHash', endpoint),
		guideExpected: optBoolean(o, 'guideExpected', endpoint),
		...decodeDeskStatus(o, endpoint),
		serverInstanceId: requiredString(o, 'serverInstanceId', endpoint),
	}
}
