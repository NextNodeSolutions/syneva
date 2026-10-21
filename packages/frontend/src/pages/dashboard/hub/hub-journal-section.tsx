import { JournalFeed } from '../journal/journal-feed'
import { PageSection } from '../react/page-section'

import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'

// The full journal the Hub page shows; the hub keeps more than a page needs.
const JOURNAL_ROWS = 200

// Every open, round, question and close, newest first: on the web the events of all the person's
// hubs, each recorded on its own machine.
export function JournalSection({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const { mode, now } = dashboard.hub
	return (
		<PageSection
			title="Journal"
			note={
				mode === 'web'
					? 'Every open, round, question and close on your hubs, newest first. Each hub keeps its own record on its machine.'
					: 'Every open, round, question and close on this hub, newest first. It stays on this machine.'
			}
		>
			<JournalFeed
				journal={dashboard.journal}
				events={dashboard.journal.events.slice(-JOURNAL_ROWS)}
				livePaths={dashboard.livePaths}
				now={now}
				emptyText="Nothing recorded yet."
			/>
		</PageSection>
	)
}
