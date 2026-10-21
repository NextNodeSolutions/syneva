// One request's round trip through the hub's router, on the Fetch API: the routes read a
// Request and return a Response, so the same handlers serve under node:http (the local hub,
// local's node-adapter.ts) and in a Durable Object (the web hub).

// What the router hands back to the transport for one request.
//
// `afterSent` is work that must follow the answer announcing it: the hub's shutdown once its
// "stopping" reply is out, a desk's close once its stop is acknowledged, a Send's wake-up of the
// agent once the reviewer's ack is out. It runs exactly once, when the transport is done with
// the response: under node:http once the response is handed over whole or the client went away
// first; in a Durable Object right after the handler returns the response, the only point an
// object has (no waitUntil). A route that returned has committed what its answer announces (a
// Send is recorded and journaled, a shutdown or a close accepted), so a client gone before
// the answer cancels none of it: each hook orders a side effect after the answer, and none
// depends on the bytes having reached the client - a handed-over response itself only reached
// the operating system.
//
// `isUnclaimedRead` marks a GET or HEAD that every guard let through and that no route and no
// UI file claimed: `response` is the hub's not-found, and a transport with a UI server of its
// own (the dev loop's Vite middleware, which needs node:http's own request and response) may
// answer it instead. Nothing before the guards ever carries it.
export type Served = {
	response: Response
	afterSent: () => void
	isUnclaimedRead: boolean
}

// How one request reached the router. `direct`, every transport's own request: the Host/Origin
// guard and the access guard (key, cookie) run first. `relayed-over-pairing`: a request the web
// relayed over a paired hub's socket (RFC 0001, 4.5 step 3), which the hub's token authenticated
// and which carries no Host, Origin, key or cookie of its own: both guards are skipped for that
// request alone - never a switch on the router - after the probe let only the relayable paths
// through (contracts/relay.ts); every route's own validation runs as for any request.
export type RequestChannel = 'direct' | 'relayed-over-pairing'

// One request as every route sees it: the request, its URL parsed once, how it reached the
// router, and the one way to defer work until the response is handed over (Served.afterSent).
// A route reads `channel` where the web may do less than the machine: the trust boundary of a
// relayed request is the web account, so what the machine keeps for itself (its own settings,
// the programs it launches, the folders it serves) is never the web's to change.
export type HubRequest = {
	request: Request
	url: URL
	channel: RequestChannel
	afterSent: (hook: () => void) => void
}

export type Exchange = {
	hub: HubRequest
	served(response: Response): Served
	unclaimed(response: Response): Served
}

// The hooks run in the order the route registered them, all of them, once.
export function openExchange(
	request: Request,
	channel: RequestChannel = 'direct',
): Exchange {
	const hooks: Array<() => void> = []
	const hub: HubRequest = {
		request,
		url: new URL(request.url),
		channel,
		afterSent: hook => {
			hooks.push(hook)
		},
	}
	const runHooks = (): void => {
		for (const hook of hooks.splice(0)) hook()
	}
	return {
		hub,
		served: response => ({
			response,
			afterSent: runHooks,
			isUnclaimedRead: false,
		}),
		unclaimed: response => ({
			response,
			afterSent: runHooks,
			isUnclaimedRead: true,
		}),
	}
}
