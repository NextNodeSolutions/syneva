import { API_PATHS } from '@syneva/contracts/routes'
import {
	HTTP_NO_CONTENT,
	HTTP_OK,
	bodiless,
	json,
} from '@syneva/core/http/http'

import type { AwaitEvent } from '@syneva/contracts/agent'
import type { EventStream } from '@syneva/core/application/events'
import type { RouteRequest, RouteTable } from '@syneva/core/http/router'
import type { DeskContext } from '@syneva/core/hub/context'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const MS_PER_SECOND = 1000

// A long-poll with no --timeout holds for the reviewer's whole round; a harness wanting a bounded wait passes ?timeout=<seconds>.
const HOLD_DEFAULT_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND

// The routes only a server that can hold a request open serves, layered over the core desk
// routes by the local hub (local-server.ts), never part of them: the web hub never parks a
// request (an agent's long wait there is a hibernating socket), so the core table must not
// carry one.
export const parkedRoutes: RouteTable = {
	[`GET ${API_PATHS.awaitSend}`]: awaitSend,
}

// The agent's wait for the reviewer's next word: a request the server parks and the desk's next
// event resolves - the push path, never a poll. A queued event answers at once; else it settles
// on the next event, or with a 204 once its hold runs out or the agent hangs up.
async function awaitSend({
	ctx,
	request,
	url,
}: RouteRequest): Promise<Response> {
	const queued = ctx.events.takeNext()
	if (queued) return deliver(ctx, queued)
	const event = await nextEvent(ctx.events, request.signal, holdMs(url))
	return event ? deliver(ctx, event) : bodiless(HTTP_NO_CONTENT)
}

// Null once the hold runs out or the caller hangs up (ctrl-C on `syneva await` aborts its
// request's signal): either way the waiter is unparked, so the event stays queued for the next
// await rather than vanishing into a dead socket.
async function nextEvent(
	events: EventStream,
	signal: AbortSignal,
	holdForMs: number,
): Promise<AwaitEvent | null> {
	if (signal.aborted) return null
	const { promise, resolve } = Promise.withResolvers<AwaitEvent | null>()
	const unpark = events.park(resolve)
	const giveUp = (): void => {
		unpark()
		resolve(null)
	}
	const timer = setTimeout(giveUp, holdForMs)
	signal.addEventListener('abort', giveUp, { once: true })
	try {
		return await promise
	} finally {
		clearTimeout(timer)
		signal.removeEventListener('abort', giveUp)
	}
}

// Hand the agent its event. A review it receives is the round picked up: journaled once the
// response carries it - a waiter that hung up first never had it (the review stays queued) -
// and named by the review itself, the oldest queued Send rather than the latest.
function deliver(ctx: DeskContext, event: AwaitEvent): Response {
	const response = json(HTTP_OK, event)
	if (event.kind === 'review')
		ctx.recordEvent({ kind: 'round-picked' }, event.result)
	return response
}

function holdMs(url: URL): number {
	const timeoutSec = Number(url.searchParams.get('timeout'))
	if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) return HOLD_DEFAULT_MS
	return timeoutSec * MS_PER_SECOND
}
