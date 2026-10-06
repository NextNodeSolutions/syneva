import { questionPayload } from '../../../../application/review-result.js'
import {
	HTTP_NO_CONTENT,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	readJsonBody,
	json,
	fail,
} from '../http.js'

import { parseCommentRequest } from './comment-body.js'

import type { ServerResponse } from 'node:http'
import type { AwaitEvent } from '@syneva/contracts/agent'
import type { DeskContext } from '../context.js'
import type { RouteRequest } from '../router.js'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const MS_PER_SECOND = 1000

// A long-poll with no --timeout holds for the reviewer's whole round; a harness wanting a bounded wait passes ?timeout=<seconds>.
const HOLD_DEFAULT_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND

export async function askQuestion({
	ctx,
	req,
	res,
}: RouteRequest): Promise<void> {
	const body: unknown = await readJsonBody(req)
	const request = parseCommentRequest(body)
	if (!request)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_QUESTION',
			error: 'ask requires path and body',
			fix: 'Send { path, lineNumber, side, body } as JSON.',
		})
	// Bake the singular into a one-element `questions` here, so a question handed straight to a parked waiter already carries the array (batching only merges on drain).
	const question = questionPayload(ctx.state, request)
	const questions = [question]
	ctx.events.emit({ kind: 'question', question, questions })
	ctx.recordEvent({ kind: 'question-asked', questions: questions.length })
	json(res, HTTP_OK, { ok: true })
}

export async function awaitEvent({
	ctx,
	req,
	res,
	url,
}: RouteRequest): Promise<void> {
	const queued = ctx.events.takeNext()
	if (queued) return deliver(ctx, res, queued)
	let isSettled = false
	const unpark = ctx.events.park((event: AwaitEvent): void => {
		if (isSettled) return
		isSettled = true
		clearTimeout(timer)
		deliver(ctx, res, event)
	})
	const timer = setTimeout((): void => {
		if (isSettled) return
		isSettled = true
		unpark()
		res.writeHead(HTTP_NO_CONTENT)
		res.end()
	}, holdMs(url))
	// A caller that hangs up (ctrl-C on `syneva await`) unparks its waiter: the event stays queued for the next await rather than vanishing into a dead socket.
	req.on('close', (): void => {
		if (isSettled) return
		isSettled = true
		clearTimeout(timer)
		unpark()
	})
}

// Hand the agent its event. A review it receives is the round picked up: journaled once the
// response carries it - a waiter that hung up first never had it (the review stays queued) -
// and named by the review itself, the oldest queued Send rather than the latest.
function deliver(
	ctx: DeskContext,
	res: ServerResponse,
	event: AwaitEvent,
): void {
	json(res, HTTP_OK, event)
	if (event.kind === 'review')
		ctx.recordEvent({ kind: 'round-picked' }, event.result)
}

export async function postStatus({
	ctx,
	req,
	res,
}: RouteRequest): Promise<void> {
	// Ephemeral agent activity (`syneva status`); never persisted.
	const body: unknown = await readJsonBody(req)
	const text = parseStatusRequest(body)
	if (!text)
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_STATUS',
			error: 'status requires a non-empty body',
			fix: 'Send { body: "what you are doing" } as JSON.',
		})
	ctx.activity.set(text)
	json(res, HTTP_OK, { ok: true })
}

export async function stopDesk({ ctx, res }: RouteRequest): Promise<void> {
	// Close the desk on the hub once the response has flushed; the hub tells any parked waiter WHY (a `closed` event) before dropping it, so an agent's loop learns the human ended the review rather than watching the socket die.
	// The hub keeps running; the review stays saved.
	res.on('finish', () => ctx.close())
	json(res, HTTP_OK, { ok: true, stopping: true })
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
