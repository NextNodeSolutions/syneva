// The relay's allowlist (RFC 0001, 4.5 and section 7), derived from routes.ts: the paths the web
// may relay to a paired hub, checked on both ends - by the Worker before it relays, by the probe
// before it dispatches. Anything not listed here is refused: `/poll` (the `pulse` frames replace
// it), `/await-send` (an agent talks to its own hub, never to the web), the stream, the hub's
// health, journal, listing, settings and shutdown, its bridge routes, sign-in, pages and assets.
import { API_PATHS, DESK_API_PREFIX, HUB_PATHS } from './routes.js'

import type { RelayMethod } from './bridge.js'

const RELAY_METHODS: ReadonlySet<string> = new Set<RelayMethod>([
	'GET',
	'POST',
	'DELETE',
])

const UNRELAYED_DESK_ROUTES: ReadonlySet<string> = new Set([
	API_PATHS.poll,
	API_PATHS.awaitSend,
])

// Every desk route but the two above, whatever its method: the desk's own route table answers
// a method it does not serve, as it does locally.
const RELAYED_DESK_ROUTES: ReadonlySet<string> = new Set(
	Object.values(API_PATHS).filter(route => !UNRELAYED_DESK_ROUTES.has(route)),
)

// A desk, plan or web desk id: hex, nothing that could climb out of its segment.
const ID_SEGMENT = /^[a-f0-9]+$/
const PLAN_VERSION = /^[1-9]\d*$/
// /<id>/status: the plan's id and the one segment after it.
const STATUS_SEGMENTS = 2

// Whether the web relays `method path` to a paired hub; `path` without its query, as a `req`
// frame carries it (a desk named by its web id or its local id alike).
export function isRelayable(method: string, path: string): boolean {
	if (!RELAY_METHODS.has(method)) return false
	if (path.startsWith(DESK_API_PREFIX))
		return isRelayedDeskRoute(path.slice(DESK_API_PREFIX.length))
	return isRelayedHubRoute(method, path)
}

function isRelayedDeskRoute(rest: string): boolean {
	const [id = '', route = '', ...more] = rest.split('/')
	return (
		ID_SEGMENT.test(id) &&
		!more.length &&
		RELAYED_DESK_ROUTES.has(`/${route}`)
	)
}

// The hub routes the web relays (RFC 4.7): open a desk, read an open's review source, close a
// desk, and the plan library. The listing and the journal travel as frames instead.
function isRelayedHubRoute(method: string, path: string): boolean {
	if (path === HUB_PATHS.desks || path === HUB_PATHS.inventory)
		return method === 'POST'
	if (path === HUB_PATHS.plans) return method === 'GET'
	const desk = segmentsUnder(HUB_PATHS.desks, path)
	if (desk) return method === 'DELETE' && isIdOnly(desk)
	const plan = segmentsUnder(HUB_PATHS.plans, path)
	if (plan) return isRelayedPlanRoute(method, plan)
	return false
}

// GET /plans/<id>, GET /plans/<id>/versions/<n>, POST /plans/<id>/status.
function isRelayedPlanRoute(method: string, segments: string[]): boolean {
	const [id = '', segment = '', version = '', ...more] = segments
	if (!ID_SEGMENT.test(id) || more.length) return false
	if (!segment) return method === 'GET' && segments.length === 1
	if (segment === 'status')
		return method === 'POST' && segments.length === STATUS_SEGMENTS
	return (
		segment === 'versions' && method === 'GET' && PLAN_VERSION.test(version)
	)
}

function segmentsUnder(prefix: string, path: string): string[] | null {
	if (!path.startsWith(`${prefix}/`)) return null
	return path.slice(prefix.length + 1).split('/')
}

function isIdOnly(segments: string[]): boolean {
	const [id = '', ...more] = segments
	return ID_SEGMENT.test(id) && !more.length
}
