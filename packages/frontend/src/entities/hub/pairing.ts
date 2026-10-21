import {
	assertObject,
	DecodeError,
	enumValue,
	optNumber,
	requiredBoolean,
	requiredString,
} from '@shared/api/decode'

// The hub's pairing with the web as the Hub page shows it, from the hub's own stream (its
// `pairing` frame). Declared here, not re-exported from @syneva/contracts, so the contract stays
// behind the entity's boundary; keep it structurally in sync with packages/contracts/src/
// pairing.ts. Every time is epoch ms.

// Where the probe's socket to the web stands, and since or until when.
export type PairingLink =
	| { state: 'off' }
	| { state: 'connecting'; since: number }
	| { state: 'connected'; since: number }
	| { state: 'backoff'; until: number }
	| { state: 'stopped'; reason: 'revoked' | 'unauthorized'; since: number }

// How the probe's last socket ended: its close code, or the status that refused its upgrade.
export type PairingClose = {
	at: number
	code: number | null
	status: number | null
	reason: string
}

export type HubPairing =
	| { paired: false }
	| {
			paired: true
			// The web's origin, the hub's id on it and the name it knows the hub by.
			web: string
			hubId: string
			name: string
			pairedAt: number
			link: PairingLink
			lastClose: PairingClose | null
	  }

const LINK_STATES = [
	'off',
	'connecting',
	'connected',
	'backoff',
	'stopped',
] as const
const STOP_REASONS = ['revoked', 'unauthorized'] as const

export function decodePairing(raw: unknown, endpoint: string): HubPairing {
	const o = assertObject(raw, endpoint, 'pairing')
	if (!requiredBoolean(o, 'paired', endpoint)) return { paired: false }
	return {
		paired: true,
		web: requiredString(o, 'web', endpoint),
		hubId: requiredString(o, 'hubId', endpoint),
		name: requiredString(o, 'name', endpoint),
		pairedAt: timeOf(o, 'pairedAt', endpoint),
		link: decodeLink(o.link, endpoint),
		lastClose: decodeClose(o.lastClose, endpoint),
	}
}

function decodeLink(raw: unknown, endpoint: string): PairingLink {
	const o = assertObject(raw, endpoint, 'pairing.link')
	const state = enumValue(
		o.state,
		endpoint,
		LINK_STATES,
		'pairing.link.state',
	)
	if (state === 'off') return { state }
	if (state === 'backoff')
		return { state, until: timeOf(o, 'until', endpoint) }
	const since = timeOf(o, 'since', endpoint)
	if (state !== 'stopped') return { state, since }
	const reason = enumValue(
		o.reason,
		endpoint,
		STOP_REASONS,
		'pairing.link.reason',
	)
	return { state, reason, since }
}

function decodeClose(raw: unknown, endpoint: string): PairingClose | null {
	if (raw === null) return null
	const o = assertObject(raw, endpoint, 'pairing.lastClose')
	return {
		at: timeOf(o, 'at', endpoint),
		code: optNumber(o, 'code', endpoint) ?? null,
		status: optNumber(o, 'status', endpoint) ?? null,
		reason: requiredString(o, 'reason', endpoint),
	}
}

function timeOf(
	o: Record<string, unknown>,
	key: string,
	endpoint: string,
): number {
	const at = Date.parse(requiredString(o, key, endpoint))
	if (Number.isNaN(at))
		throw new DecodeError(`${key} is not a time`, endpoint)
	return at
}
