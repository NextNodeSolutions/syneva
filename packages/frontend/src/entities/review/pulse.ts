// The review entity's boundary on the hub's stream: a desk's `pulse` (RFC 0001, 4.4), carried raw
// by the hub entity's store, decoded here onto the review's model. Loaded with the desk's stream,
// after the first paint, never with the page.
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

import type { DeskPulse } from './model'

// A payload that does not read names the stream's path, as an HTTP read names its route.
const SOCKET = BRIDGE_PATHS.tabSocket

// Async: a pulse that carries a guide loads the guide's decoders first, as a /state read does.
export async function readDeskPulse(raw: unknown): Promise<DeskPulse> {
	await ensureGuideDecoders(raw)
	const o = assertObject(raw, SOCKET, 'pulse')
	const ctx = { endpoint: SOCKET }
	return {
		baseDiffHash: requiredString(o, 'baseDiffHash', SOCKET),
		...decodeGuideFields(o, ctx),
		guideExpected: optBoolean(o, 'guideExpected', SOCKET),
		comments: requiredArray(o, 'comments', SOCKET, 'comments').map(c =>
			decodeComment(c, ctx),
		),
		domainComments: decodeDomainComments(o, ctx),
		...decodeDeskStatus(o, SOCKET),
		serverInstanceId: requiredString(o, 'serverInstanceId', SOCKET),
	}
}
