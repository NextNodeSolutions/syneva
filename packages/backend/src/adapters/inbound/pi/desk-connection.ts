import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { API_PATHS } from '@syneva/contracts/routes'

import { sanitizeSession } from '../../../domain/identity.js'
import { reviewDir } from '../../outbound/filesystem/desk.js'
import { resolveRoot } from '../cli/args.js'
import {
	connectHub,
	deskEndpoint,
	findDesk,
	resolveHubUrl,
} from '../cli/hub-client.js'

export type DeskTarget = { repo: string; session: string }
export type DeskConnection = DeskTarget & {
	// Route paths append to it.
	url: string
	hubUrl: string
	key: string | undefined
	id: string
	directory: string
}
const CONNECT_TIMEOUT_MS = 5000
const HOLD_SECONDS = 300
const HOLD_TIMEOUT_MS = 310_000
const NO_CONTENT = 204
const NOT_FOUND = 404
const SERVER_ERROR_FLOOR = 500

// A transport failure the listener may ride out (the hub restarting, a dropped socket, a 5xx); anything else (a desk that is gone, a malformed envelope) ends the attachment.
export class TransientDeskError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options)
		this.name = 'TransientDeskError'
	}
}

// A hub the user named (SYNEVA_HUB) is theirs to trust, wherever it is; otherwise only a loopback hub qualifies - a stale or edited lock must never turn this listener into a request to a remote host. Redirects are refused too.
export function attachableHubUrl(hubUrl: string): URL {
	const url = new URL(hubUrl)
	const isNamed = Boolean(process.env.SYNEVA_HUB)
	const isLoopback = ['127.0.0.1', '[::1]', 'localhost'].includes(
		url.hostname,
	)
	if (
		!['http:', 'https:'].includes(url.protocol) ||
		(!isNamed && (!isLoopback || url.protocol !== 'http:')) ||
		url.username ||
		url.password
	)
		throw new Error(
			'Syneva attachment requires a loopback hub, or a hub named by SYNEVA_HUB.',
		)
	return url
}

function authHeaders(key: string | undefined): Record<string, string> {
	const headers: Record<string, string> = {}
	if (key) headers.authorization = `Bearer ${key}`
	return headers
}

export async function connectDesk(target: DeskTarget): Promise<DeskConnection> {
	const repo = await resolveRoot({ repo: target.repo })
	const session = sanitizeSession(target.session)
	const hub = await connectHub({}, { autostart: false })
	if (!hub)
		throw new Error(
			`No Syneva hub is running at ${await resolveHubUrl({})}. Start it with \`syneva start\`, open the desk, then attach.`,
		)
	attachableHubUrl(hub.url)
	const desk = await findDesk(hub, repo, session)
	if (!desk)
		throw new Error(
			`No Syneva desk for ${repo} / ${session} on ${hub.url}. Open it first with \`syneva open --session ${session}\`.`,
		)
	const url = deskEndpoint(hub.url, desk.id, '')
	const response = await fetch(`${url}${API_PATHS.poll}`, {
		headers: authHeaders(hub.key),
		signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
		redirect: 'error',
	})
	if (!response.ok)
		throw new Error(`Syneva attachment failed: HTTP ${response.status}.`)
	const poll: unknown = await response.json()
	if (
		!poll ||
		typeof poll !== 'object' ||
		!('agentListening' in poll) ||
		typeof poll.agentListening !== 'boolean'
	)
		throw new Error(
			'The desk did not return Syneva agent status. Restart or update the hub.',
		)
	if (poll.agentListening)
		throw new Error(
			'An agent is already listening to this desk. Detach it before attaching another session.',
		)
	return {
		repo,
		session,
		id: desk.id,
		url,
		hubUrl: hub.url,
		key: hub.key,
		directory: await reviewDir(repo, session),
	}
}

// Save every received envelope before notifying Pi: large reviews deliver as a file reference
// rather than truncated JSON, and a failed wake still leaves evidence. Returns the written event's
// path AND kind, or '' on a long-poll timeout (the caller rearms); `closed` means the human ended
// the review.
export async function receiveDeskEvent(
	connection: DeskConnection,
	signal: AbortSignal,
): Promise<string | { eventPath: string; kind: string }> {
	let response: Response
	try {
		response = await fetch(
			`${connection.url}${API_PATHS.awaitSend}?timeout=${HOLD_SECONDS}`,
			{
				headers: authHeaders(connection.key),
				signal: AbortSignal.any([
					signal,
					AbortSignal.timeout(HOLD_TIMEOUT_MS),
				]),
				redirect: 'error',
			},
		)
	} catch (error) {
		// The hub is unreachable (restarting, or the socket dropped): the listener retries.
		throw new TransientDeskError('the Syneva hub is not answering', {
			cause: error,
		})
	}
	if (response.status === NO_CONTENT) return ''
	if (response.status === NOT_FOUND)
		throw new Error('the desk is no longer open on the hub.')
	if (response.status >= SERVER_ERROR_FLOOR)
		throw new TransientDeskError(
			`the Syneva hub answered HTTP ${response.status}`,
		)
	if (!response.ok)
		throw new Error(`Syneva listener failed: HTTP ${response.status}.`)
	const envelope: unknown = await response.json()
	const kind =
		typeof envelope === 'object' && envelope !== null && 'kind' in envelope
			? String(envelope.kind)
			: ''
	if (!['question', 'review', 'closed'].includes(kind))
		throw new Error('Syneva returned an invalid event envelope.')
	const eventPath = path.join(
		connection.directory,
		`pi-event-${randomUUID()}.json`,
	)
	await writeFile(eventPath, JSON.stringify(envelope), { mode: 0o600 })
	return { eventPath, kind }
}
