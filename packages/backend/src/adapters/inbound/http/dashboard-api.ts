import { HUB_PATHS } from '@syneva/contracts/routes'

import { readJournal, saveHubSettings, serveHubSettings } from './hub-routes.js'

import type { HubRequest } from './exchange.js'
import type { HubRouteDeps } from './hub-routes.js'

// What the dashboard reads beside the desks and the plan library: the journal and the reviewer's
// preferences. Null when the path is neither, so the router goes on.
export async function dashboardApi(
	deps: Pick<HubRouteDeps, 'journal' | 'settings'>,
	{ request, url }: HubRequest,
): Promise<Response | null> {
	if (url.pathname === HUB_PATHS.journal && request.method === 'GET')
		return readJournal(deps, url)
	if (url.pathname !== HUB_PATHS.settings) return null
	if (request.method === 'GET') return serveHubSettings(deps)
	if (request.method === 'POST') return saveHubSettings(deps, request)
	return null
}
