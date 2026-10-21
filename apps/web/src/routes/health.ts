// GET /api/hub/health on the web: the shape a local hub answers (HubHealth), so a client that
// probes a hub can probe the web the same way. The web holds no desk of its own in this phase
// (its desks are its hubs'), needs no access key (a session is its key), and is one build: its
// instance is the build's commit, started when it was built.
import { HUB_PATHS } from '@syneva/contracts/routes'

import { json } from '../http/answer.js'
import { isRead } from '../http/call.js'
import { HTTP_OK } from '../http/status.js'

import type { HubHealth } from '@syneva/contracts/hub'
import type { Call } from '../http/call.js'

export function healthRoute({ request, url }: Call): Response | null {
	if (url.pathname !== HUB_PATHS.health || !isRead(request)) return null
	const health: HubHealth = {
		ok: true,
		version: SYNEVA_VERSION,
		instanceId: SYNEVA_BUILD_ID,
		startedAt: SYNEVA_BUILT_AT,
		desks: 0,
		keyRequired: false,
	}
	return json(HTTP_OK, health)
}
