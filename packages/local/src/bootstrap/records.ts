import { randomUUID } from 'node:crypto'

import { createHubJournal } from '@syneva/core/application/journal'
import { createPlanLibrary } from '@syneva/core/application/plan-library'
import { createHub } from '@syneva/core/hub/hub'

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

import type { HubJournal } from '@syneva/core/application/journal'
import type { PlanLibrary } from '@syneva/core/application/plan-library'
import type { Hub } from '@syneva/core/hub/hub'
import type { HubOptions } from '../adapters/inbound/http/options.js'

const DEFAULT_STATUS_TTL_MS = 90_000

export type HubRecords = { hub: Hub; journal: HubJournal; plans: PlanLibrary }

// One journal for the hub's desks to record into and the dashboard to read; one plan library for
// its plan desks to post into; the hub over both.
export function wireRecords(
	options: HubOptions,
	log: (line: string) => void,
): HubRecords {
	const journal = createHubJournal(nodeHubJournal, log)
	const plans = createPlanLibrary(nodePlanStore, nodeGit.workspace, log)
	const hub = wireHub(options, { journal, plans }, log)
	return { hub, journal, plans }
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
