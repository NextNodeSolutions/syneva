import os from 'node:os'

import { LOCAL_HUB_ID } from '@syneva/contracts/bridge'
import { createAccessGuard } from '@syneva/core/http/auth'
import { resolveBinding } from '@syneva/core/http/binding'

import { listenOn } from '../adapters/inbound/http/listen.js'
import {
	createLocalServer,
	portOf,
} from '../adapters/inbound/http/local-server.js'
import {
	DEFAULT_HOST,
	DEFAULT_HUB_PORT,
} from '../adapters/inbound/http/options.js'
import { builtUi } from '../adapters/inbound/http/routes/static.js'
import { hubLog } from '../adapters/outbound/console.js'
import { nodeSettings } from '../adapters/outbound/filesystem/desk.js'

import { connectBridge, wireBridge } from './bridge.js'
import { wireRecords } from './records.js'

import type { HubIdentity } from '@syneva/contracts/bridge'
import type { Hub } from '@syneva/core/hub/hub'
import type { LocalServer } from '../adapters/inbound/http/local-server.js'
import type { HubHandle, HubOptions } from '../adapters/inbound/http/options.js'
import type { Bridge } from '../adapters/outbound/bridge/bridge.js'

// Start the hub: bind, wire the collaborators, restore previously hosted desks, hand back the URLs; origin guard, access guard, desk registry and per-desk mutation mutexes all live behind this call.
// Binding a taken port rejects (EADDRINUSE) - the CLI decides what that means (a hub already running is the normal case).
export async function startHub(options: HubOptions): Promise<HubHandle> {
	const host = options.host ?? DEFAULT_HOST
	const publicUrl = options.publicUrl ? new URL(options.publicUrl) : undefined
	const binding = resolveBinding(
		host,
		os.hostname(),
		options.allowedHosts ?? [],
		publicUrl?.host,
	)
	const guard = createAccessGuard(
		options.key,
		publicUrl?.protocol === 'https:',
	)
	const log = options.log ?? hubLog
	const records = wireRecords(options, log)
	const { hub } = records
	const bridge = wireBridge({ ...records, version: options.version }, log)
	const { server, stream } = createLocalServer({
		...records,
		settings: nodeSettings,
		guard,
		binding,
		ui: options.ui ?? builtUi,
		uiMiddleware: options.uiMiddleware,
		version: options.version,
		keyRequired: guard.keyRequired,
		onShutdown: () => options.onShutdown?.(),
		homeDir: os.homedir(),
		identity: identityOf(hub, options.version),
		bridge,
		log,
	})
	await listenOn(server, options.port ?? DEFAULT_HUB_PORT, host)
	void connectBridge(bridge, log)
	await hub.restore()
	const port = portOf(server)
	return {
		server,
		hub,
		port,
		url: publicUrl?.href ?? `http://${binding.browserHost}:${port}/`,
		localUrl: `http://${binding.lockHost}:${port}/`,
		close: () => closeHub({ server, stream }, bridge, hub),
	}
}

// Who the hub's stream says it is: the local hub, named after the machine.
function identityOf(hub: Hub, version: string): HubIdentity {
	return {
		id: LOCAL_HUB_ID,
		name: os.hostname(),
		version,
		instanceId: hub.instanceId,
		startedAt: hub.startedAt,
	}
}

// The probe closes its socket with `normal` and the stream's sockets with `goingAway` (a tab
// reconnects once a hub answers again); parked long-polls are cut (an agent's `await` exits
// non-zero and re-checks the hub); the registry is written one last time so the next start
// restores the same desks.
async function closeHub(
	{ server, stream }: LocalServer,
	bridge: Bridge,
	hub: Hub,
): Promise<void> {
	await Promise.all([bridge.close(), stream.close()])
	server.closeAllConnections()
	await new Promise<void>(resolve => {
		server.close(() => resolve())
	})
	await hub.persist()
}
