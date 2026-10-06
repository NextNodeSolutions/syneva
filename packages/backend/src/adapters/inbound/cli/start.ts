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

import type { HubHandle, HubOptions } from '../http/options.js'
import type { UiServer } from '../http/routes/static.js'
import type { CliArgs } from './args.js'

export const SIGNAL_EXIT_CODE = 130

// Idempotent: a hub already answering on the port means already running (exit 0 with its URL), never a second hub. `ui` is the dev loop's seam; the CLI never passes it.
export async function runStart(args: CliArgs, ui?: UiServer): Promise<void> {
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
	// Hub starts only - the agent subcommands must never block on a prompt. On a confirmed update this re-execs the new version with the same args and never returns.
	await maybeOfferUpdate()
	const handle = await bindHub(args, { host, key, ui })
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
	await new Promise<never>(() => {})
}

async function bindHub(
	args: CliArgs,
	{ host, key, ui }: Pick<HubOptions, 'host' | 'key' | 'ui'>,
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
			ui,
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

// A taken port is normal when a hub already runs there: say so and exit 0, so a second `syneva start` (or a background auto-start racing another) converges on one hub.
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
let stopping: Promise<void> | undefined

// One teardown, however often it is asked for: a terminal's Ctrl-C reaches the hub once from the tty and once more from every wrapper that relays signals, and a second teardown would exit before the first has persisted the registry.
function stopProcess(code: number): Promise<void> {
	stopping ??= closeAndExit(code)
	return stopping
}

async function closeAndExit(code: number): Promise<void> {
	await handleToClose?.close().catch(() => undefined)
	await removeHubLock(process.pid)
	process.exit(code)
}

function installExitHandlers(handle: HubHandle): void {
	handleToClose = handle
	for (const signal of ['SIGINT', 'SIGTERM'] as const)
		process.on(signal, () => {
			if (stopping) return
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
	// Bound beyond loopback: the hub runs editor commands and mutates git, so anyone who can reach this address AND holds the key controls it. Say so every launch.
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

export async function runHubStatus(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: false, url: await resolveHubUrl(args) })
		process.exitCode = 1
		return
	}
	printJson({ url: hub.url, ...hub.health })
}

// Desks stay in the registry; the next start restores them. Idempotent: no hub is already the asked-for state.
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
