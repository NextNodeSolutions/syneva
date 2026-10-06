import type { LedgerContext } from './react/desk-ledger'
import type { DashboardState } from './use-dashboard'

// What every ledger on the dashboard reads besides its desks: the clock, whether the hub
// answers, the desks that just arrived, and the closes.
export function ledgerContext(dashboard: DashboardState): LedgerContext {
	return {
		now: dashboard.hub.now,
		isLive: dashboard.listed?.isStale !== true,
		arrivedIds: dashboard.hub.arrivedIds,
		close: dashboard.close,
		since: dashboard.since,
	}
}
