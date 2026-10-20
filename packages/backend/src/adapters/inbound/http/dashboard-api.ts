import { HUB_PATHS } from '@syneva/contracts/routes'

import { readJournal, saveHubSettings, serveHubSettings } from './hub-routes.js'
import { handlePlanApi } from './plan-routes.js'

import type { HubRouteDeps } from './hub-routes.js'
import type { StaticRequest } from './routes/static.js'

// What the dashboard reads beside the desks: the journal, the reviewer's preferences and the plan
// library. False when the path is none of them, so the router goes on.
export async function handleDashboardApi(
	deps: HubRouteDeps,
	{ req, res, url }: StaticRequest,
): Promise<boolean> {
	if (url.pathname === HUB_PATHS.journal && req.method === 'GET') {
		await readJournal(deps, res, url)
		return true
	}
	if (url.pathname !== HUB_PATHS.settings)
		return handlePlanApi(deps, { req, res, url })
	if (req.method === 'GET') await serveHubSettings(deps, res)
	else if (req.method === 'POST') await saveHubSettings(deps, req, res)
	else return false
	return true
}
