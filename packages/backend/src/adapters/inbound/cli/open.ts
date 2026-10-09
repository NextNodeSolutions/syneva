import path from 'node:path'

import { HUB_PATHS } from '@syneva/contracts/routes'

import { printJson, warn } from '../../outbound/console.js'
import { openBrowser } from '../http/listen.js'

import { flagText, loadGuideArg, resolveRepo } from './args.js'
import { connectHub, hubEndpoint, hubSend } from './hub-client.js'
import { failureText, readDesk } from './hub-wire.js'

import type { DeskSummary, OpenDeskRequest } from '@syneva/contracts/hub'
import type { ReviewMode } from '@syneva/contracts/review'
import type { CliArgs } from './args.js'
import type { HubConnection } from './hub-client.js'

const HTTP_OK = 200

// Open a desk on the hub (starting the hub detached when none runs); idempotent: a live desk for this repo+session is reused with its diff reloaded into the open tab.
// Paths resolve here, against the agent's cwd, because the hub's cwd is never the agent's.
export async function runOpen(
	mode: ReviewMode,
	target: string | undefined,
	args: CliArgs,
): Promise<void> {
	if (mode === 'file' && !target) {
		warn('Usage: syneva open file <path>')
		process.exitCode = 1
		return
	}
	const guide = loadGuideArg(args.guide)
	if (guide === null) {
		process.exitCode = 1
		return
	}
	const hub = await connectHub(args, { autostart: true })
	if (!hub) {
		warn(
			'No Syneva hub is running and none could be started. Run `syneva start` and retry.',
		)
		process.exitCode = 1
		return
	}
	const request: OpenDeskRequest = {
		...deskRequest(mode, target, args),
		...guideField(guide),
	}
	const response = await hubSend(
		hub,
		'POST',
		hubEndpoint(hub.url, HUB_PATHS.desks),
		request,
	)
	const desk = response.status === HTTP_OK ? readOpened(response.body) : null
	if (!desk) {
		warn(failureText(response.body, 'The hub could not open the desk.'))
		process.exitCode = 1
		return
	}
	await report(hub, desk, args)
}

// The review source as the CLI names it for the hub, shared by `open` and `inventory` so the two always name the same desk.
export function deskRequest(
	mode: ReviewMode,
	target: string | undefined,
	args: CliArgs,
): Omit<OpenDeskRequest, 'guide'> {
	const repo = resolveRepo(args)
	const pathFilter = flagText(args, 'path')
	return {
		root: repo,
		mode,
		session: flagText(args, 'session'),
		// A file is reviewed where it is: resolved against the repo the command runs in; a PR ref is a name, never a path.
		target: mode === 'file' && target ? path.resolve(repo, target) : target,
		base: mode === 'pr' ? flagText(args, 'base') : undefined,
		staged:
			mode === 'repo' && (args.diff === 'staged' || args.staged === true),
		path: pathFilter ? path.resolve(repo, pathFilter) : undefined,
	}
}

// The `guide` key only when a guide was given: an absent key means none, and whatever a present key holds (null included) is validated, never ignored.
function guideField(
	guide: OpenDeskRequest['guide'],
): { guide: OpenDeskRequest['guide'] } | undefined {
	if (!guide) return undefined
	return { guide }
}

type Opened = { desk: DeskSummary; outcome: 'created' | 'reloaded' }

function readOpened(body: unknown): Opened | null {
	if (typeof body !== 'object' || body === null || !('desk' in body))
		return null
	const desk = readDesk(body.desk)
	if (!desk) return null
	const outcome =
		'outcome' in body && body.outcome === 'reloaded'
			? 'reloaded'
			: 'created'
	return { desk, outcome }
}

// stderr tells the human (the URL line is what harness prompts grep for); stdout hands the agent
// the machine facts. The browser opens only for a NEW desk - a reused one already has its tab.
async function report(
	hub: HubConnection,
	{ desk, outcome }: Opened,
	args: CliArgs,
): Promise<void> {
	const url = `${hub.url}${desk.path.slice(1)}`
	warn(`Syneva ${deskLabel(desk)}: ${url}`)
	if (outcome === 'reloaded')
		warn(
			`Desk already live for session "${desk.session}" - reloaded in the open tab.`,
		)
	if (desk.empty)
		warn(
			'Nothing to review yet - the desk is open and shows your next `syneva reload`.',
		)
	warn(`Dashboard: ${hub.url}`)
	printJson({
		ok: true,
		deskId: desk.id,
		url,
		dashboard: hub.url,
		session: desk.session,
		mode: desk.mode,
		outcome,
		empty: desk.empty,
	})
	if (outcome === 'created' && args.open !== false) await openBrowser(url)
}

function deskLabel(desk: DeskSummary): string {
	if (desk.mode === 'repo') return desk.session
	return `${desk.mode}:${desk.target ?? ''} [${desk.session}]`
}
