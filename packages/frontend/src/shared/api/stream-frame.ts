import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import {
	assertObject,
	optString,
	requiredArray,
	requiredBoolean,
	requiredString,
} from './decode'

import type { BridgeFrame } from '@syneva/contracts/bridge'

// A frame as a tab reads it: its envelope checked against BridgeFrame here, its payload (the
// hub's identity, a desk, a pulse, journal events, a plan, the hub's pairing) left unknown for
// the entity that owns its model to decode.
type Kind = BridgeFrame['t']
type Envelope<T extends Kind> = Extract<BridgeFrame, { t: T }>
type Carrying<
	T extends Kind,
	K extends keyof Envelope<T>,
	Payload = unknown,
> = Omit<Envelope<T>, K> & { [P in K]: Payload }

export type StreamFrame =
	| Envelope<'hubs-end'>
	| Carrying<'hello', 'hub'>
	| Carrying<'desk', 'desk'>
	| Envelope<'closed'>
	| Carrying<'pulse', 'pulse'>
	| Carrying<'journal', 'events', readonly unknown[]>
	| Carrying<'plan', 'plan'>
	| Envelope<'snapshot-end'>
	| Carrying<'pairing', 'pairing'>
	| Envelope<'hub'>

// Decode failures name the stream's path, as an HTTP read names its route.
const SOCKET = BRIDGE_PATHS.tabSocket

type Wire = Record<string, unknown>

// Null is the web's word for a hub that never connected.
function nullableString(o: Wire, key: string): string | null | undefined {
	if (o[key] === null) return null
	return optString(o, key, SOCKET)
}

const hubIdOf = (o: Wire): string => requiredString(o, 'hubId', SOCKET)
const deskIdOf = (o: Wire): string => requiredString(o, 'deskId', SOCKET)

// One reader per frame a tab acts on. The relay's frames (`req`, `res`, `chunk`, `err`,
// `cancel`) and `snapshot?` travel between a hub and the web's object, never to a tab.
const READERS: ReadonlyMap<string, (o: Wire) => StreamFrame> = new Map<
	string,
	(o: Wire) => StreamFrame
>([
	['hubs-end', () => ({ t: 'hubs-end' })],
	['hello', o => ({ t: 'hello', hub: o.hub })],
	['desk', o => ({ t: 'desk', hubId: hubIdOf(o), desk: o.desk })],
	['closed', o => ({ t: 'closed', hubId: hubIdOf(o), deskId: deskIdOf(o) })],
	[
		'pulse',
		o => ({
			t: 'pulse',
			hubId: hubIdOf(o),
			deskId: deskIdOf(o),
			pulse: o.pulse,
		}),
	],
	[
		'journal',
		o => ({
			t: 'journal',
			hubId: hubIdOf(o),
			events: requiredArray(o, 'events', SOCKET),
		}),
	],
	['plan', o => ({ t: 'plan', hubId: hubIdOf(o), plan: o.plan })],
	['snapshot-end', o => ({ t: 'snapshot-end', hubId: hubIdOf(o) })],
	['pairing', o => ({ t: 'pairing', hubId: hubIdOf(o), pairing: o.pairing })],
	[
		'hub',
		o => ({
			t: 'hub',
			hubId: hubIdOf(o),
			name: requiredString(o, 'name', SOCKET),
			online: requiredBoolean(o, 'online', SOCKET),
			version: optString(o, 'version', SOCKET),
			lastSeenAt: nullableString(o, 'lastSeenAt'),
		}),
	],
])

// The frame a text carries, or null when it is no frame a tab reads (a kind a newer hub sends,
// a relay frame). A frame of a known kind whose envelope does not read throws DecodeError; a
// text that is not JSON throws SyntaxError.
export function readFrame(text: string): StreamFrame | null {
	const raw: unknown = JSON.parse(text)
	const o = assertObject(raw, SOCKET, 'frame')
	const kind = o.t
	if (typeof kind !== 'string') return null
	const read = READERS.get(kind)
	if (!read) return null
	return read(o)
}
