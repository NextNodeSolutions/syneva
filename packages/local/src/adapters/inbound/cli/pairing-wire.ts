// The running hub told its pairing changed (POST /api/hub/bridge/reconnect), and its answer as
// the CLI reads it: field by field, only what `syneva login` and `logout` say.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'
import { HUB_PATHS } from '@syneva/contracts/routes'

import { connectHub, hubEndpoint } from './hub-client.js'

import type { PairingLink } from '@syneva/contracts/pairing'
import type { CliArgs } from './args.js'
import type { HubConnection, JsonResponse } from './hub-client.js'

// The hub answers once its probe connected or failed a first attempt, which its handshake
// deadline (`pongTimeoutMs`) bounds: this leaves the hub as long again to answer.
const RECONNECT_WAIT_MS =
	BRIDGE_LIMITS.pongTimeoutMs + BRIDGE_LIMITS.pongTimeoutMs
const HTTP_OK = 200

// What the hub says of its pairing: whether it holds one, its link's state, and why its last
// socket ended.
export type HubPairing = {
	isPaired: boolean
	link: PairingLink['state']
	lastClose: string | null
}

export type HubTold =
	| { kind: 'no-hub' }
	| { kind: 'refused'; reason: string }
	| { kind: 'told'; pairing: HubPairing }

// This machine's hub only: another machine's (SYNEVA_HUB) reads its own bridge.json, and the
// route answers loopback peers alone.
export async function tellHub(args: CliArgs): Promise<HubTold> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) return { kind: 'no-hub' }
	const answer = await reconnect(hub)
	const pairing =
		answer.status === HTTP_OK ? readHubPairing(answer.body) : null
	if (pairing) return { kind: 'told', pairing }
	return { kind: 'refused', reason: refusalOf(answer) }
}

// A bodiless POST with the hub's key, given as long as the hub's answer may take.
async function reconnect(hub: HubConnection): Promise<JsonResponse> {
	const headers: Record<string, string> = {}
	if (hub.key) headers.authorization = `Bearer ${hub.key}`
	try {
		const response = await fetch(
			hubEndpoint(hub.url, HUB_PATHS.bridgeReconnect),
			{
				method: 'POST',
				headers,
				signal: AbortSignal.timeout(RECONNECT_WAIT_MS),
			},
		)
		return { status: response.status, body: await jsonOf(response) }
	} catch {
		return { status: 0, body: null }
	}
}

async function jsonOf(response: Response): Promise<unknown> {
	try {
		return await response.json()
	} catch {
		return null
	}
}

function refusalOf(answer: { status: number; body: unknown }): string {
	if (!answer.status) return 'it did not answer'
	const fields = fieldsOf(answer.body)
	const error = typeof fields?.error === 'string' ? `: ${fields.error}` : ''
	return `it answered ${answer.status}${error}`
}

function fieldsOf(raw: unknown): Record<string, unknown> | null {
	if (typeof raw !== 'object' || raw === null) return null
	return Object.fromEntries(Object.entries(raw))
}

const LINK_STATES: ReadonlySet<string> = new Set<PairingLink['state']>([
	'off',
	'connecting',
	'connected',
	'backoff',
	'stopped',
])

function isLinkState(state: unknown): state is PairingLink['state'] {
	return typeof state === 'string' && LINK_STATES.has(state)
}

function readHubPairing(body: unknown): HubPairing | null {
	const pairing = fieldsOf(fieldsOf(body)?.pairing)
	if (!pairing || typeof pairing.paired !== 'boolean') return null
	if (!pairing.paired)
		return { isPaired: false, link: 'off', lastClose: null }
	const state = fieldsOf(pairing.link)?.state
	if (!isLinkState(state)) return null
	const reason = fieldsOf(pairing.lastClose)?.reason
	return {
		isPaired: true,
		link: state,
		lastClose: typeof reason === 'string' ? reason : null,
	}
}
