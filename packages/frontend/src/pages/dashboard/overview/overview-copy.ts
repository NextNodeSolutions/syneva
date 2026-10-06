import { turnCounts } from '@entities/hub/turn'

import type { HubDesk } from '@entities/hub/model'

// The line under the overview's statement: the turns other than the reviewer's, in the order
// a round runs, the empty ones left out. The statement above it already says what waits on
// the reviewer.
export function turnSummary(desks: readonly HubDesk[]): string {
	const counts = turnCounts(desks)
	const parts = [
		counts.agent ? `${counts.agent} with your agent at work` : '',
		counts.sent ? `${counts.sent} sent, not picked up` : '',
		counts.idle ? `${counts.idle} idle` : '',
	].filter(Boolean)
	if (!parts.length) return 'Every other desk is quiet.'
	return `${parts.join(' · ')}.`
}
