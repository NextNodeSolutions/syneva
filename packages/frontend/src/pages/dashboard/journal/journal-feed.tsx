import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { useFreshAfter } from '../use-fresh-after'

import { eventLine, eventTime } from './event-copy'
import { journalFeed } from './journal-feed.styles'

import type { Journal, JournalEvent } from '@entities/hub/journal'
import type { ReactElement } from 'react'

type JournalFeedProps = {
	journal: Journal
	// The newest `limit` events, filtered by the caller (a project's, a desk's).
	events: readonly JournalEvent[]
	// The desks still open on the hub, by id: their name links to them.
	livePaths: ReadonlyMap<string, string>
	now: number
	emptyText: string
}

function DeskName({
	event,
	livePaths,
}: {
	event: JournalEvent
	livePaths: ReadonlyMap<string, string>
}): ReactElement {
	const path = livePaths.get(event.deskId)
	const name = `${event.session} · ${event.project}`
	if (!path) return <span {...stylex.props(journalFeed.desk)}>{name}</span>
	// A desk is its own page, not one of the dashboard's: the link navigates.
	return (
		<a
			href={path}
			{...stylex.props(
				focus.ring,
				journalFeed.desk,
				journalFeed.deskLink,
			)}
		>
			{name}
		</a>
	)
}

// The hub's journal, newest first: what happened, when, and on which desk. An event that just
// arrived lands on the wash, once (use-fresh-after.ts).
export function JournalFeed({
	journal,
	events,
	livePaths,
	now,
	emptyText,
}: JournalFeedProps): ReactElement {
	const freshAfter = useFreshAfter(journal)
	if (!events.length)
		return <p {...stylex.props(journalFeed.empty)}>{emptyText}</p>
	return (
		<ol {...stylex.props(journalFeed.list)}>
			{events.toReversed().map(event => {
				const line = eventLine(event)
				return (
					<li
						key={event.seq}
						data-enter="rise"
						{...stylex.props(
							journalFeed.row,
							event.seq > freshAfter && journalFeed.fresh,
						)}
					>
						<time
							dateTime={event.at}
							{...stylex.props(journalFeed.time)}
						>
							{eventTime(event.at, now)}
						</time>
						<LiveDot
							tone={line.tone}
							hollow={line.isHollow}
							css={journalFeed.dot}
						/>
						<span {...stylex.props(journalFeed.text)}>
							{line.text}{' '}
							<DeskName event={event} livePaths={livePaths} />
						</span>
					</li>
				)
			})}
		</ol>
	)
}
