import { randomUUID } from 'node:crypto'
import http from 'node:http'
import os from 'node:os'

import { createAccessGuard } from '../adapters/inbound/http/auth.js'
import {
	authoritiesFor,
	resolveBinding,
} from '../adapters/inbound/http/binding.js'
import { createHub } from '../adapters/inbound/http/hub.js'
import { listenOn } from '../adapters/inbound/http/listen.js'
import {
	DEFAULT_HOST,
	DEFAULT_HUB_PORT,
} from '../adapters/inbound/http/options.js'
import { createHubRequestHandler } from '../adapters/inbound/http/router.js'
import { routes } from '../adapters/inbound/http/routes.js'
import { builtUi } from '../adapters/inbound/http/routes/static.js'
import { hubLog } from '../adapters/outbound/console.js'
import { editorPort } from '../adapters/outbound/editor/open-editor.js'
import { nodeSettings } from '../adapters/outbound/filesystem/desk.js'
import {
	nodeHubJournal,
	nodeHubRegistry,
} from '../adapters/outbound/filesystem/hub.js'
import { nodeReviewStore } from '../adapters/outbound/filesystem/persistence.js'
import { nodeGit } from '../adapters/outbound/git/repo.js'
import { createHubJournal } from '../application/journal.js'

import type { Hub } from '../adapters/inbound/http/hub.js'
import type { HubHandle, HubOptions } from '../adapters/inbound/http/options.js'
import type { HubJournal } from '../application/journal.js'

const DEFAULT_STATUS_TTL_MS = 90_000

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
	// One journal for the hub's desks to record into and the dashboard to read.
	const journal = createHubJournal(nodeHubJournal, log)
	const hub = wireHub(options, journal, log)
	const server = http.createServer()
	server.on(
		'request',
		createHubRequestHandler({
			hub,
			journal,
			settings: nodeSettings,
			guard,
			// The origin guard re-reads the port per request: server.address() is populated only once the socket is bound.
			authorities: () => authoritiesFor(binding, portOf(server)),
			deskRoutes: routes,
			ui: options.ui ?? builtUi,
			version: options.version,
			keyRequired: guard.keyRequired,
			onShutdown: () => options.onShutdown?.(),
		}),
	)
	await listenOn(server, options.port ?? DEFAULT_HUB_PORT, host)
	await hub.restore()
	const port = portOf(server)
	return {
		server,
		hub,
		port,
		url: publicUrl?.href ?? `http://${binding.browserHost}:${port}/`,
		localUrl: `http://${binding.lockHost}:${port}/`,
		close: () => closeHub(server, hub),
	}
}

function wireHub(
	options: HubOptions,
	journal: HubJournal,
	log: (line: string) => void,
): Hub {
	return createHub(
		{
			git: nodeGit,
			store: nodeReviewStore,
			settings: nodeSettings,
			editor: editorPort(options.runEditorCommand),
			registry: nodeHubRegistry,
			journal,
			statusTtlMs: options.statusTtlMs ?? DEFAULT_STATUS_TTL_MS,
			log,
		},
		randomUUID(),
	)
}

// Parked long-polls are cut (an agent's `await` exits non-zero and re-checks the hub); the registry is written one last time so the next start restores the same desks.
async function closeHub(server: http.Server, hub: Hub): Promise<void> {
	server.closeAllConnections()
	await new Promise<void>(resolve => {
		server.close(() => resolve())
	})
	await hub.persist()
}

function portOf(server: http.Server): number {
	const address = server.address()
	return typeof address === 'object' && address ? address.port : 0
}
