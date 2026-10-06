import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { listedTitle } from '../../head-copy'
import { PageHead } from '../../react/page-head'
import { turnSummary } from '../overview-copy'

import { DisplayMenu } from './display-menu'
import { FilterChips } from './filter-chips'
import { FilterMenu } from './filter-menu'
import { overview } from './overview.styles'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../../use-dashboard'
import type { DisplayPrefsState } from '../use-display-prefs'
import type { OverviewViewState } from '../use-overview-view'

// The head: the statement over whose turn it is, the Filter and Display controls, and the
// filters in force. It enters once, when the overview opens.
export function OverviewHead({
	dashboard,
	listed,
	view,
	prefs,
}: {
	dashboard: DashboardState
	listed: Listed
	view: OverviewViewState
	prefs: DisplayPrefsState
}): ReactElement {
	const head = useRef<HTMLDivElement>(null)
	useEntrance(head, 'overview')
	return (
		<div ref={head} {...stylex.props(overview.part)}>
			<PageHead
				title={listedTitle(listed.desks)}
				lede={turnSummary(listed.desks)}
			>
				<FilterMenu
					desks={listed.desks}
					projects={dashboard.projects}
					filter={view.filter}
					onFilter={filter => view.change({ filter })}
				/>
				<DisplayMenu
					layout={view.layout}
					onLayout={layout => view.change({ layout })}
					prefs={prefs}
				/>
			</PageHead>
			<FilterChips
				filter={view.filter}
				projects={dashboard.projects}
				onFilter={filter => view.change({ filter })}
			/>
		</div>
	)
}
