import { roundsOf } from '@entities/hub/journal-stats'
import { Button } from '@shared/ui/button'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { eventTime } from '../journal/event-copy'
import { modeKeyOf } from '../overview/display'
import { MODE_NAMES } from '../overview/filter-names'
import { useReopen } from '../use-reopen'

import { closedList } from './closed-desks.styles'

import type { DeskClosed, JournalEvent } from '@entities/hub/journal'
import type { ReactElement } from 'react'
import type { Reopen } from '../use-reopen'

type ClosedDesksProps = {
	closed: readonly DeskClosed[]
	events: readonly JournalEvent[]
	now: number
	title: string
}

function ClosedRow({
	closed,
	rounds,
	now,
	reopen,
}: {
	closed: DeskClosed
	rounds: number
	now: number
	reopen: Reopen
}): ReactElement {
	const failure = reopen.failures.get(closed.deskId)
	const what = [closed.project, MODE_NAMES[modeKeyOf(closed)], closed.target]
		.filter(Boolean)
		.join(' · ')
	return (
		<li {...stylex.props(closedList.row)} data-enter="rise">
			<LiveDot hollow />
			<div>
				<p {...stylex.props(closedList.name)}>{closed.session}</p>
				<p {...stylex.props(closedList.meta)}>{what}</p>
			</div>
			<p {...stylex.props(closedList.progress)}>
				{`Closed ${eventTime(closed.at, now)} · ${closed.approvedFiles}/${closed.files} files approved${rounds ? ` · ${rounds} rounds` : ''}`}
			</p>
			<Button
				size="small"
				busy={reopen.busyId === closed.deskId}
				busyLabel="Reopening…"
				aria-label={`Reopen ${closed.session}`}
				onClick={() => void reopen.reopen(closed)}
			>
				Reopen
			</Button>
			{failure && <p {...stylex.props(closedList.failure)}>{failure}</p>}
		</li>
	)
}

// The desks that left the hub, newest first: what each reviewed, when it closed and how far its
// review had come. Reopen opens it again as it was, its saved verdicts with it.
export function ClosedDesks({
	closed,
	events,
	now,
	title,
}: ClosedDesksProps): ReactElement {
	// One reopen state for the list: a single desk reopens at a time.
	const reopen = useReopen()
	return (
		<section
			{...stylex.props(closedList.root)}
			aria-labelledby="closed-title"
		>
			<div {...stylex.props(closedList.head)} data-enter="fade">
				<h2 id="closed-title" {...stylex.props(closedList.title)}>
					{title}
				</h2>
				<span {...stylex.props(closedList.count)}>{closed.length}</span>
			</div>
			{!closed.length && (
				<p {...stylex.props(closedList.empty)}>
					No desk has closed yet. A closed desk keeps its review and
					can be reopened from here.
				</p>
			)}
			<ul>
				{closed.map(entry => (
					<ClosedRow
						key={entry.deskId}
						closed={entry}
						rounds={roundsOf(events, entry.deskId)}
						now={now}
						reopen={reopen}
					/>
				))}
			</ul>
		</section>
	)
}
