import {
	domainQuestionPayload,
	questionPayload,
} from '../../../../application/review-result.js'
import { domainTarget } from '../../../../domain/domain-comments.js'
import {
	HTTP_NO_CONTENT,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	bodiless,
	readJsonBody,
	json,
	fail,
} from '../http.js'

import {
	isDomainCommentBody,
	parseCommentRequest,
	parseDomainCommentRequest,
} from './comment-body.js'

import type { AwaitEvent, QuestionPayload } from '@syneva/contracts/agent'
import type { EventStream } from '../../../../application/events.js'
import type { DeskContext } from '../context.js'
import type { RouteRequest } from '../router.js'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const MS_PER_SECOND = 1000

// A long-poll with no --timeout holds for the reviewer's whole round; a harness wanting a bounded wait passes ?timeout=<seconds>.
const HOLD_DEFAULT_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND

export async function askQuestion({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	const body: unknown = await readJsonBody(request)
	if (isDomainCommentBody(body)) return askDomainQuestion(ctx, body)
	const question = parseCommentRequest(body)
	if (!question)
		return fail({
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_QUESTION',
			error: 'ask requires path and body',
			fix: 'Send { path, lineNumber, side, body } as JSON, or { domainId, blockId?, body } for a guide question.',
		})
	emitQuestion(ctx, questionPayload(ctx.state, question))
	return json(HTTP_OK, { ok: true })
}

// Bake the singular into a one-element `questions` here, so a question handed straight to a parked waiter already carries the array (batching only merges on drain). Recorded as it happens.
function emitQuestion(ctx: DeskContext, question: QuestionPayload): void {
	const questions = [question]
	ctx.events.emit({ kind: 'question', question, questions })
	ctx.recordEvent({ kind: 'question-asked', questions: questions.length })
}

// A question on the guide: the reviewer's own copy rides /save like a line question's; the event carries the target's context so the agent reads the right explanation and code.
function askDomainQuestion(ctx: DeskContext, body: unknown): Response {
	const request = parseDomainCommentRequest(body)
	if (!request)
		return fail({
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_QUESTION',
			error: 'a domain question requires domainId and body',
			fix: 'Send { domainId, blockId?, body } as JSON.',
		})
	const target = ctx.state.guide
		? domainTarget(ctx.state.guide, request)
		: null
	if (!target)
		return fail({
			status: HTTP_UNPROCESSABLE,
			code: 'UNKNOWN_DOMAIN',
			error: `The attached guide has no such domain${request.blockId ? ' or block' : ''}.`,
			fix: 'Name a domain id (and block id) of the attached guide.',
		})
	emitQuestion(
		ctx,
		domainQuestionPayload(ctx.state, { target, body: request.body }),
	)
	return json(HTTP_OK, { ok: true })
}

// The agent's wait for the reviewer's next word: a request the server parks and the desk's next
// event resolves - the push path, never a poll. A queued event answers at once; else it settles
// on the next event, or with a 204 once its hold runs out or the agent hangs up.
export async function awaitEvent({
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

export async function postStatus({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	// Ephemeral agent activity (`syneva status`); never persisted.
	const body: unknown = await readJsonBody(request)
	const text = parseStatusRequest(body)
	if (!text)
		return fail({
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_STATUS',
			error: 'status requires a non-empty body',
			fix: 'Send { body: "what you are doing" } as JSON.',
		})
	ctx.activity.set(text)
	return json(HTTP_OK, { ok: true })
}

export async function stopDesk({
	ctx,
	afterSent,
}: RouteRequest): Promise<Response> {
	// Close the desk on the hub once the response is handed over (Served.afterSent); the hub tells any parked waiter WHY (a `closed` event) before dropping it, so an agent's loop learns the human ended the review rather than watching the socket die.
	// The hub keeps running; the review stays saved.
	afterSent(() => ctx.close())
	return json(HTTP_OK, { ok: true, stopping: true })
}

function parseStatusRequest(payload: unknown): string {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('body' in payload) ||
		typeof payload.body !== 'string'
	)
		return ''
	return payload.body.trim()
}

function holdMs(url: URL): number {
	const timeoutSec = Number(url.searchParams.get('timeout'))
	if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) return HOLD_DEFAULT_MS
	return timeoutSec * MS_PER_SECOND
}
