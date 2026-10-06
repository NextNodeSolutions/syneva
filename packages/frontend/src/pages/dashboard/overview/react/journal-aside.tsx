import { AppLink } from '@shared/ui/app-link'
import * as stylex from '@stylexjs/stylex'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'
import { focus } from '@syneva/design-system/controls.styles'

import { JournalFeed } from '../../journal/journal-feed'
import { passes } from '../display'

import { overview } from './overview.styles'

import type { ReactElement } from 'react'
import type { DashboardState } from '../../use-dashboard'
import type { DeskFilter } from '../display'

// The newest events the overview's journal shows; the Hub page keeps the rest.
const JOURNAL_ROWS = 24

// The journal beside the overview's list, under the same filters: what happened, newest first.
export function JournalAside({
	dashboard,
	filter,
}: {
	dashboard: DashboardState
	filter: DeskFilter
}): ReactElement {
	const events = dashboard.journal.events
		.filter(event => passes(event, filter))
		.slice(-JOURNAL_ROWS)
	return (
		<aside
			{...stylex.props(overview.journal)}
			aria-labelledby="journal-title"
		>
			<div {...stylex.props(overview.journalHead)} data-enter="fade">
				<h2 id="journal-title" {...stylex.props(overview.journalTitle)}>
					Journal
				</h2>
				<AppLink
					href={DASHBOARD_PATHS.hub}
					css={[focus.ring, overview.journalLink]}
				>
					All activity
				</AppLink>
			</div>
			<JournalFeed
				journal={dashboard.journal}
				events={events}
				livePaths={dashboard.livePaths}
				now={dashboard.hub.now}
				emptyText="Nothing recorded yet. Opens, rounds and questions land here as they happen."
			/>
		</aside>
	)
}
