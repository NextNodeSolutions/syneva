import { spawn } from 'node:child_process'
import { closeSync, realpathSync } from 'node:fs'
import http from 'node:http'

import { deskApiBase, HUB_PATHS } from '@syneva/contracts/routes'

import { sanitizeSession } from '../../../domain/identity.js'
import { warn } from '../../outbound/console.js'
import {
	isProcessAlive,
	openHubLog,
	readHubLock,
} from '../../outbound/filesystem/hub.js'
import { DEFAULT_HUB_PORT } from '../http/options.js'

import { flagText } from './args.js'
import { readDesks } from './hub-wire.js'

import type { DeskSummary, HubHealth } from '@syneva/contracts/hub'
import type { CliArgs } from './args.js'

// Everything the agent subcommands send or receive goes through here: the wire shapes are read field by field in one place (never casts at call sites) and the hub is found one way.

const HEALTH_TIMEOUT_MS = 1500
const POST_TIMEOUT_MS = 10_000
const AUTOSTART_WAIT_MS = 15_000
const AUTOSTART_POLL_MS = 150
const NO_CONTENT = 204
const UNAUTHORIZED = 401

export type HubConnection = {
	url: string
	key: string | undefined
	health: HubHealth
}

export type JsonResponse = { status: number; body: unknown }

// `--hub` / SYNEVA_HUB when the user named one (a hosted hub), else the hub this machine's lock recorded (when its process is alive), else the loopback origin (honoring `--port` / SYNEVA_PORT).
export async function resolveHubUrl(args: CliArgs): Promise<string> {
	const configured = flagText(args, 'hub') ?? process.env.SYNEVA_HUB
	if (configured) return withTrailingSlash(configured)
	const port = flagText(args, 'port') ?? process.env.SYNEVA_PORT
	if (port) return `http://127.0.0.1:${port}/`
	const lock = await readHubLock()
	if (lock && isProcessAlive(lock.pid)) return withTrailingSlash(lock.url)
	return `http://127.0.0.1:${DEFAULT_HUB_PORT}/`
}

export function hubKey(args: CliArgs): string | undefined {
	return flagText(args, 'key') ?? process.env.SYNEVA_KEY ?? undefined
}

function withTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : `${url}/`
}

export function hubEndpoint(url: string, path: string): string {
	return `${url}${path.slice(1)}`
}

export function deskEndpoint(url: string, id: string, path: string): string {
	return `${url}${deskApiBase(id).slice(1)}${path}`
}

function authHeaders(key: string | undefined): Record<string, string> {
	const headers: Record<string, string> = {}
	if (key) headers.authorization = `Bearer ${key}`
	return headers
}

export async function hubHealth(
	url: string,
	key: string | undefined,
): Promise<HubHealth | null> {
	try {
		const response = await fetch(hubEndpoint(url, HUB_PATHS.health), {
			headers: authHeaders(key),
			signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
		})
		if (!response.ok) return null
		return readHealth(await response.json())
	} catch {
		return null
	}
}

function readHealth(body: unknown): HubHealth | null {
	if (typeof body !== 'object' || body === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(body),
	)
	if (record.ok !== true || typeof record.instanceId !== 'string') return null
	return {
		ok: true,
		version: typeof record.version === 'string' ? record.version : '',
		instanceId: record.instanceId,
		startedAt: typeof record.startedAt === 'string' ? record.startedAt : '',
		desks: typeof record.desks === 'number' ? record.desks : 0,
		keyRequired: record.keyRequired === true,
	}
}

// Reach the hub, spawning one detached when none answers and the caller allows it (desk opens
// do; agent loop commands don't - a missing hub means the review is over, not that one should
// spring up). Null when no hub answers.
export async function connectHub(
	args: CliArgs,
	options: { autostart: boolean },
): Promise<HubConnection | null> {
	const url = await resolveHubUrl(args)
	const key = hubKey(args)
	const live = await hubHealth(url, key)
	if (live) return authorized({ url, key, health: live })
	if (!options.autostart || !canAutostart(args, url)) return null
	warn(`No Syneva hub at ${url} - starting one in the background.`)
	startDetachedHub(args)
	const started = await waitForHub(url, key)
	if (!started) return null
	return { url, key, health: started }
}

// A key-protected hub is "reachable" only with its key: say so here, once, instead of letting every command read a 401 as an empty hub; the probe is the cheapest authenticated read.
async function authorized(hub: HubConnection): Promise<HubConnection | null> {
	if (!hub.health.keyRequired) return hub
	if (!hub.key) {
		warn(
			`The hub at ${hub.url} requires an access key: pass --key <secret> or set SYNEVA_KEY.`,
		)
		return null
	}
	const probe = await hubGet(hub, HUB_PATHS.desks)
	if (probe.status === UNAUTHORIZED) {
		warn(`The hub at ${hub.url} refused the access key.`)
		return null
	}
	return hub
}

// Only a loopback hub this CLI would itself bind is auto-started: a named remote hub (SYNEVA_HUB) is somebody else's to run; SYNEVA_NO_AUTOSTART=1 opts out entirely.
function canAutostart(args: CliArgs, url: string): boolean {
	if (process.env.SYNEVA_NO_AUTOSTART) return false
	if (flagText(args, 'hub') ?? process.env.SYNEVA_HUB) return false
	return url.startsWith('http://127.0.0.1:')
}

// Spawn `syneva start --no-open` detached: stdio to ~/.syneva/hub/hub.log, outliving this CLI
// process, and idempotent - a second hub finding the port already answered exits, so two agents
// racing to open the first desk land on one hub.
export function startDetachedHub(args: CliArgs): void {
	const entry = realpathSync(process.argv[1] ?? '')
	const port = flagText(args, 'port') ?? process.env.SYNEVA_PORT
	const log = openHubLog()
	const child = spawn(
		process.execPath,
		[entry, 'start', '--no-open', ...(port ? ['--port', port] : [])],
		{
			detached: true,
			stdio: ['ignore', log, log],
			env: { ...process.env, SYNEVA_NO_UPDATE_CHECK: '1' },
			windowsHide: true,
		},
	)
	child.unref()
	closeSync(log)
}

export async function waitForHub(
	url: string,
	key: string | undefined,
): Promise<HubHealth | null> {
	const deadline = Date.now() + AUTOSTART_WAIT_MS
	// Sequential by nature: each probe decides whether the next one is needed.
	while (Date.now() < deadline) {
		// oxlint-disable-next-line eslint/no-await-in-loop
		const health = await hubHealth(url, key)
		if (health) return health
		// oxlint-disable-next-line eslint/no-await-in-loop
		await new Promise(resolve => setTimeout(resolve, AUTOSTART_POLL_MS))
	}
	return null
}

export async function hubGet(
	hub: HubConnection,
	path: string,
): Promise<JsonResponse> {
	try {
		const response = await fetch(hubEndpoint(hub.url, path), {
			headers: authHeaders(hub.key),
			signal: AbortSignal.timeout(POST_TIMEOUT_MS),
		})
		return { status: response.status, body: await readJson(response) }
	} catch {
		return { status: 0, body: null }
	}
}

export async function hubSend(
	hub: HubConnection,
	method: 'POST' | 'DELETE',
	url: string,
	payload?: object,
): Promise<JsonResponse> {
	try {
		const response = await fetch(url, {
			method,
			headers: {
				'content-type': 'application/json',
				...authHeaders(hub.key),
			},
			...jsonBody(payload),
			signal: AbortSignal.timeout(POST_TIMEOUT_MS),
		})
		return { status: response.status, body: await readJson(response) }
	} catch {
		return { status: 0, body: null }
	}
}

// RequestInit.body admits no undefined under exactOptionalPropertyTypes: a bodiless request (DELETE) gets no key at all, a payload gets its JSON.
function jsonBody(payload: object | undefined): { body: string } | undefined {
	if (!payload) return undefined
	return { body: JSON.stringify(payload) }
}

async function readJson(response: Response): Promise<unknown> {
	const text = await response.text()
	if (!text) return null
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

// GET with no client-side timeout, so a long-poll holds until the hub responds; avoids undici's ~5min headersTimeout that fetch() imposes.
export function httpGetJson(
	url: string,
	key: string | undefined,
): Promise<JsonResponse> {
	return new Promise(resolve => {
		const req = http.get(url, { headers: authHeaders(key) }, res => {
			const chunks: Buffer[] = []
			res.on('data', chunk => chunks.push(Buffer.from(chunk)))
			res.on('end', () => {
				const text = Buffer.concat(chunks).toString('utf8')
				resolve({ status: res.statusCode ?? 0, body: parseJson(text) })
			})
		})
		req.on('error', () => resolve({ status: 0, body: null }))
		req.setTimeout(0) // hold indefinitely for the long-poll
	})
}

function parseJson(text: string): unknown {
	if (!text) return null
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

export { NO_CONTENT }

// `--session` names the desk, else the lone live desk of this repo; several live desks and no --session is ambiguous: say so and stop rather than guess.
export async function findDesk(
	hub: HubConnection,
	root: string,
	session: string | undefined,
): Promise<DeskSummary | null> {
	const desks = await listDesks(hub, root)
	if (session) {
		const wanted = sanitizeSession(session)
		return desks.find(desk => desk.session === wanted) ?? null
	}
	if (desks.length > 1) {
		warn(
			`Multiple live desks for this repo (${desks.map(desk => desk.session).join(', ')}); pass --session <id>.`,
		)
		process.exit(1)
	}
	return desks.at(0) ?? null
}

export async function listDesks(
	hub: HubConnection,
	root: string | undefined,
): Promise<DeskSummary[]> {
	const query = root ? `?root=${encodeURIComponent(root)}` : ''
	const response = await hubGet(hub, `${HUB_PATHS.desks}${query}`)
	return readDesks(response.body)
}
