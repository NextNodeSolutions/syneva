// What a hub's socket says, read once per frame: the stream frames its tabs get verbatim (the
// object never re-encodes them), the relay's frames, the frames it drops, and the ones that close
// the socket. The object never trusts a field it does not need: a stream frame is checked for its
// hub id only, since the tabs decode it at their own boundary.
import { RELAY_FAILURE_STATUS } from '@syneva/contracts/bridge'

import type { BridgeFrame, RelayFailure } from '@syneva/contracts/bridge'

export type RelayFrame = Extract<
	BridgeFrame,
	{ t: 'res' } | { t: 'chunk' } | { t: 'err' } | { t: 'cancel' }
>

export type HubSays =
	// Forwarded as is to every tab, once its hub id is the socket's.
	| { kind: 'stream'; hubId: string }
	| { kind: 'relay'; frame: RelayFrame }
	// A ping or pong the auto-response did not take, a `pairing` frame (the local hub's own tabs
	// read it, never the web's), a kind this web does not know (a newer hub): passed over.
	| { kind: 'drop' }
	// Not a frame, a field that does not read, a kind only the object sends: `malformed`.
	| { kind: 'malformed' }

// The stream's kinds: what a tab reads of a hub.
const STREAM_KINDS = new Set([
	'hello',
	'desk',
	'closed',
	'pulse',
	'journal',
	'plan',
	'snapshot-end',
])
const DROPPED_KINDS = new Set(['p', 'o', 'pairing'])
// Only the object sends these; a hub that does is broken or lying.
const OBJECT_KINDS = new Set(['hub', 'snapshot?', 'req'])

const MALFORMED: HubSays = { kind: 'malformed' }

export function readHubFrame(text: string): HubSays {
	const raw = parsed(text)
	if (!raw || typeof raw.t !== 'string') return MALFORMED
	const { t } = raw
	if (STREAM_KINDS.has(t)) return streamFrame(raw)
	if (DROPPED_KINDS.has(t)) return { kind: 'drop' }
	if (OBJECT_KINDS.has(t)) return MALFORMED
	if (t === 'res' || t === 'chunk' || t === 'err' || t === 'cancel')
		return relayFrame(raw)
	return { kind: 'drop' }
}

function parsed(text: string): Record<string, unknown> | null {
	let raw: unknown = null
	try {
		raw = JSON.parse(text)
	} catch {
		return null
	}
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
		return null
	return Object.fromEntries(Object.entries(raw))
}

// `hello` names its hub inside its identity, every other stream frame by `hubId`.
function streamFrame(raw: Record<string, unknown>): HubSays {
	const hub = raw.t === 'hello' ? fieldsOf(raw.hub)?.id : raw.hubId
	if (typeof hub !== 'string') return MALFORMED
	return { kind: 'stream', hubId: hub }
}

function relayFrame(raw: Record<string, unknown>): HubSays {
	const { id } = raw
	if (typeof id !== 'string') return MALFORMED
	const frame = relayFrameOf(id, raw)
	if (!frame) return MALFORMED
	return { kind: 'relay', frame }
}

function relayFrameOf(
	id: string,
	raw: Record<string, unknown>,
): RelayFrame | null {
	if (raw.t === 'cancel') return { t: 'cancel', id }
	if (raw.t === 'err') {
		if (!isRelayFailure(raw.code)) return null
		return { t: 'err', id, code: raw.code }
	}
	// `more` is `true` or absent, never another value.
	if (!isOptional(raw.more, more => more === true)) return null
	const more = raw.more === true || undefined
	if (raw.t !== 'chunk') return answerHead(id, raw, more)
	if (typeof raw.data !== 'string') return null
	return { t: 'chunk', id, data: raw.data, more }
}

function answerHead(
	id: string,
	raw: Record<string, unknown>,
	more: true | undefined,
): RelayFrame | null {
	const { status, body } = raw
	const headers = stringRecord(raw.headers)
	if (typeof status !== 'number' || !headers) return null
	if (!isOptional(body, text => typeof text === 'string')) return null
	return { t: 'res', id, status, headers, body: textOrNone(body), more }
}

// A field that is absent, or present and of its shape.
function isOptional(
	field: unknown,
	isShaped: (field: unknown) => boolean,
): boolean {
	return typeof field === 'undefined' || isShaped(field)
}

function textOrNone(field: unknown): string | undefined {
	if (typeof field !== 'string') return undefined
	return field
}

function stringRecord(field: unknown): Record<string, string> | null {
	const fields = fieldsOf(field)
	if (!fields) return null
	const entries = Object.entries(fields)
	const texts = entries.filter(
		(entry): entry is [string, string] => typeof entry[1] === 'string',
	)
	if (texts.length !== entries.length) return null
	return Object.fromEntries(texts)
}

function fieldsOf(field: unknown): Record<string, unknown> | null {
	if (typeof field !== 'object' || field === null || Array.isArray(field))
		return null
	return Object.fromEntries(Object.entries(field))
}

function isRelayFailure(code: unknown): code is RelayFailure {
	return typeof code === 'string' && Object.hasOwn(RELAY_FAILURE_STATUS, code)
}
