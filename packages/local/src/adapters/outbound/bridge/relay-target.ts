// What a relayed `req` asks of the hub (RFC 0001, 4.5 and 4.8): its path checked against the
// relayable routes first (contracts/relay.ts), then read as itself (no dot segment, no encoding a
// URL parser would read otherwise), then every web id in it - a desk's, a plan's - traded for its
// local id, which must belong to this hub. Anything else is refused and never reaches the router.
import { splitWebDeskId } from '@syneva/contracts/bridge'
import { isRelayable } from '@syneva/contracts/relay'
import { DESK_API_PREFIX, HUB_PATHS } from '@syneva/contracts/routes'

import type { BridgeFrame } from '@syneva/contracts/bridge'

export type RelayRequest = Extract<BridgeFrame, { t: 'req' }>

export type RelayTarget = { path: string } | { refusal: string }

// The routes that name a desk or a plan by id, right after their prefix.
const ID_PREFIXES = [
	DESK_API_PREFIX,
	`${HUB_PATHS.desks}/`,
	`${HUB_PATHS.plans}/`,
]

// What a relayed path is parsed against to check that it reads as itself; no route reads the
// host of a relayed request (the router's guards are skipped for it).
export const RELAY_ORIGIN = 'http://relayed.invalid'

export function relayTarget(hubId: string, frame: RelayRequest): RelayTarget {
	const { method, path, query } = frame
	if (!isRelayable(method, path))
		return { refusal: `${method} ${path} is never relayed to a hub.` }
	if (!readsAsItself(path, query))
		return { refusal: `${path}${query} does not read as itself.` }
	const prefix = ID_PREFIXES.find(each => path.startsWith(each))
	if (!prefix) return { path }
	const [webId = '', ...rest] = path.slice(prefix.length).split('/')
	const named = splitWebDeskId(webId)
	if (named?.hubId !== hubId)
		return { refusal: `${webId} names no desk or plan of this hub.` }
	return { path: [`${prefix}${named.deskId}`, ...rest].join('/') }
}

function readsAsItself(path: string, query: string): boolean {
	if (query && (!query.startsWith('?') || query.includes('#'))) return false
	const url = new URL(`${path}${query}`, RELAY_ORIGIN)
	return url.pathname === path && url.search === query
}
