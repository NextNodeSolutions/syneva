import { randomUUID } from 'node:crypto'
import os from 'node:os'

import { LOCAL_HUB_ID } from '@syneva/contracts/bridge'
import { createHubJournal } from '@syneva/core/application/journal'
import { createPlanLibrary } from '@syneva/core/application/plan-library'
import { createAccessGuard } from '@syneva/core/http/auth'
import { resolveBinding } from '@syneva/core/http/binding'
import { createHub } from '@syneva/core/hub/hub'

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
import { editorPort } from '../adapters/outbound/editor/open-editor.js'
import { nodeSettings } from '../adapters/outbound/filesystem/desk.js'
import {
	nodeHubJournal,
	nodeHubRegistry,
} from '../adapters/outbound/filesystem/hub.js'
import { nodeReviewStore } from '../adapters/outbound/filesystem/persistence.js'
import { nodePlanStore } from '../adapters/outbound/filesystem/plans.js'
import { ghPullRequests } from '../adapters/outbound/git/pull-requests.js'
import { nodeGit } from '../adapters/outbound/git/repo.js'

import type { HubIdentity } from '@syneva/contracts/bridge'
import type { HubJournal } from '@syneva/core/application/journal'
import type { PlanLibrary } from '@syneva/core/application/plan-library'
import type { Hub } from '@syneva/core/hub/hub'
import type { LocalServer } from '../adapters/inbound/http/local-server.js'
import type { HubHandle, HubOptions } from '../adapters/inbound/http/options.js'

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
	// One journal for the hub's desks to record into and the dashboard to read; one plan library
	// for its plan desks to post into.
	const journal = createHubJournal(nodeHubJournal, log)
	const plans = createPlanLibrary(nodePlanStore, nodeGit.workspace, log)
	const hub = wireHub(options, { journal, plans }, log)
	const { server, stream } = createLocalServer({
		hub,
		journal,
		plans,
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
		log,
	})
	await listenOn(server, options.port ?? DEFAULT_HUB_PORT, host)
	await hub.restore()
	const port = portOf(server)
	return {
		server,
		hub,
		port,
		url: publicUrl?.href ?? `http://${binding.browserHost}:${port}/`,
		localUrl: `http://${binding.lockHost}:${port}/`,
		close: () => closeHub({ server, stream }, hub),
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

// The records are what the hub keeps as it runs, beside its desks.
function wireHub(
	options: HubOptions,
	{ journal, plans }: { journal: HubJournal; plans: PlanLibrary },
	log: (line: string) => void,
): Hub {
	return createHub(
		{
			git: nodeGit,
			store: nodeReviewStore,
			settings: nodeSettings,
			editor: editorPort(options.runEditorCommand),
			registry: nodeHubRegistry,
			pulls: ghPullRequests,
			journal,
			plans,
			statusTtlMs: options.statusTtlMs ?? DEFAULT_STATUS_TTL_MS,
			log,
		},
		randomUUID(),
	)
}

// The stream's sockets close first with `goingAway` (a tab reconnects once a hub answers again);
// parked long-polls are cut (an agent's `await` exits non-zero and re-checks the hub); the
// registry is written one last time so the next start restores the same desks.
async function closeHub(
	{ server, stream }: LocalServer,
	hub: Hub,
): Promise<void> {
	await stream.close()
	server.closeAllConnections()
	await new Promise<void>(resolve => {
		server.close(() => resolve())
	})
	await hub.persist()
}
