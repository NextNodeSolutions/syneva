import { HUB_PATHS } from '@syneva/contracts/routes'

import { startHub } from '../../../bootstrap/hub.js'
import { printJson, warn } from '../../outbound/console.js'
import {
	hubLogPath,
	removeHubLock,
	writeHubLock,
} from '../../outbound/filesystem/hub.js'
import {
	currentVersion,
	maybeOfferUpdate,
} from '../../outbound/package-registry/update.js'
import { isLoopbackHost } from '../http/binding.js'
import { openBrowser } from '../http/listen.js'
import { DEFAULT_HOST, DEFAULT_HUB_PORT } from '../http/options.js'

import { flagText } from './args.js'
import {
	connectHub,
	hubEndpoint,
	hubHealth,
	hubKey,
	hubSend,
	resolveHubUrl,
	startDetachedHub,
	waitForHub,
} from './hub-client.js'

import type { HubHandle } from '../http/options.js'
import type { CliArgs } from './args.js'

const SIGNAL_EXIT_CODE = 130

// `syneva start` - run the hub: one long-lived process per machine that hosts every desk and
// serves the dashboard. Idempotent: a hub already answering on the port means "already
// running" (exit 0 with its URL), never a second hub.
export async function runStart(args: CliArgs): Promise<void> {
	const host =
		flagText(args, 'host') ?? process.env.SYNEVA_HOST ?? DEFAULT_HOST
	const key = hubKey(args)
	if (!isLoopbackHost(host) && !key && args.insecure !== true) {
		warn(
			`Binding beyond loopback (--host ${host}) requires an access key: pass --key <secret> (or SYNEVA_KEY). The hub runs editor commands and mutates git, so an open bind belongs only on a fully trusted network - \`--insecure\` acknowledges that.`,
		)
		process.exitCode = 1
		return
	}
	if (args.detach === true) return startInBackground(args)
	// Hub starts only - the agent subcommands must never block on a prompt. On a confirmed
	// update this re-execs the new version with the same args and never returns.
	await maybeOfferUpdate()
	const handle = await bindHub(args, host, key)
	if (!handle) return
	await writeHubLock({
		pid: process.pid,
		url: handle.localUrl,
		startedAt: new Date().toISOString(),
		version: currentVersion(),
	})
	installExitHandlers(handle)
	announce(handle, host, key)
	if (args.open !== false) await openBrowser(handle.url)
	// The hub is persistent: keep serving until interrupted or asked to stop.
	await new Promise<never>(() => {})
}

async function bindHub(
	args: CliArgs,
	host: string,
	key: string | undefined,
): Promise<HubHandle | null> {
	const port = Number(
		flagText(args, 'port') ?? process.env.SYNEVA_PORT ?? DEFAULT_HUB_PORT,
	)
	const publicUrl =
		flagText(args, 'public-url') ?? process.env.SYNEVA_PUBLIC_URL
	try {
		return await startHub({
			port,
			host,
			key,
			publicUrl,
			allowedHosts: readAllowedHosts(),
			version: currentVersion(),
			onShutdown: () => {
				warn('Hub stopped via syneva hub stop.')
				void stopProcess(0)
			},
		})
	} catch (error) {
		return explainBindFailure(error, port, key)
	}
}

// A taken port is normal when a hub already runs there: say so and exit 0, so a second
// `syneva start` (or the CLI's background auto-start racing another) converges on one hub.
async function explainBindFailure(
	error: unknown,
	port: number,
	key: string | undefined,
): Promise<null> {
	const code =
		typeof error === 'object' && error !== null && 'code' in error
			? error.code
			: undefined
	if (code === 'EADDRINUSE') {
		const url = `http://127.0.0.1:${port}/`
		const live = await hubHealth(url, key)
		if (live) {
			warn(`Syneva hub already running at ${url} (v${live.version}).`)
			return null
		}
		warn(
			`Port ${port} is held by another process. Stop it, or start the hub elsewhere with --port <n> (agents then need SYNEVA_PORT=<n>).`,
		)
	} else warn(`Could not start the hub: ${String(error)}`)
	process.exitCode = 1
	return null
}

function readAllowedHosts(): string[] {
	return (process.env.SYNEVA_ALLOWED_HOSTS ?? '')
		.split(',')
		.map(host => host.trim())
		.filter(Boolean)
}

let handleToClose: HubHandle | undefined

async function stopProcess(code: number): Promise<void> {
	const handle = handleToClose
	handleToClose = undefined
	if (handle) await handle.close().catch(() => undefined)
	await removeHubLock(process.pid)
	process.exit(code)
}

function installExitHandlers(handle: HubHandle): void {
	handleToClose = handle
	for (const signal of ['SIGINT', 'SIGTERM'] as const)
		process.on(signal, () => {
			warn(
				'Hub stopping - desks stay saved; `syneva start` restores them.',
			)
			void stopProcess(SIGNAL_EXIT_CODE)
		})
}

function announce(
	handle: HubHandle,
	host: string,
	key: string | undefined,
): void {
	warn(`Syneva hub: ${handle.url}`)
	if (key)
		warn(
			'Access key required - browsers sign in at /login, the CLI reads SYNEVA_KEY.',
		)
	// Bound beyond loopback: the hub runs editor commands and mutates git, so anyone who can
	// reach this address AND holds the key controls it. Say so every launch.
	if (!isLoopbackHost(host))
		warn(
			key
				? `⚠ Bound to ${host} - reachable beyond this machine; the key is the only lock.`
				: `⚠ Bound to ${host} WITHOUT a key (--insecure) - anyone who can reach it controls your repos.`,
		)
	warn(
		`Desks: ${handle.hub.listDesks().length}. Agents attach with \`syneva open\`; the dashboard lists every project. Ctrl-C to stop (log: ${hubLogPath()}).`,
	)
}

// `syneva start --detach` - fork the hub into the background and return once it answers.
async function startInBackground(args: CliArgs): Promise<void> {
	const url = await resolveHubUrl(args)
	const key = hubKey(args)
	const live = await hubHealth(url, key)
	if (live) {
		warn(`Syneva hub already running at ${url} (v${live.version}).`)
		printJson({ ok: true, url, started: false })
		return
	}
	startDetachedHub(args)
	const started = await waitForHub(url, key)
	if (!started) {
		warn(`The hub did not come up at ${url} - see ${hubLogPath()}.`)
		process.exitCode = 1
		return
	}
	warn(`Syneva hub: ${url} (background, log: ${hubLogPath()})`)
	printJson({ ok: true, url, started: true })
}

// `syneva hub` - the running hub's health as JSON (exit 1 when none answers).
export async function runHubStatus(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: false, url: await resolveHubUrl(args) })
		process.exitCode = 1
		return
	}
	printJson({ url: hub.url, ...hub.health })
}

// `syneva hub stop` - ask the hub to exit. Desks stay in the registry; the next start restores
// them. Idempotent: no hub is already the asked-for state.
export async function runHubStop(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: true, stopped: false })
		return
	}
	const response = await hubSend(
		hub,
		'POST',
		hubEndpoint(hub.url, HUB_PATHS.shutdown),
	)
	if (response.status !== HTTP_OK_STATUS) {
		warn('The hub did not accept the stop request.')
		process.exitCode = 1
		return
	}
	printJson({ ok: true, stopped: true, url: hub.url })
}

const HTTP_OK_STATUS = 200
