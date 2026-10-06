import { latestRounds } from '@entities/hub/journal-stats'
import { Button } from '@shared/ui/button'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { modeParts, unbroken } from '../format'
import { eventTime } from '../journal/event-copy'
import { useReopen } from '../use-reopen'

import { closedList } from './closed-desks.styles'
import { deskArrival } from './desk-row.styles'

import type { DeskClosed, JournalEvent } from '@entities/hub/journal'
import type { ReactElement } from 'react'
import type { Reopen } from '../use-reopen'

type ClosedDesksProps = {
	closed: readonly DeskClosed[]
	events: readonly JournalEvent[]
	now: number
	title: string
}

// A space a line never breaks at.
const NO_BREAK = unbroken(' ')

// When the desk closed, how far its review had come and how many rounds it ran, each part kept
// whole: a narrow line breaks only after a separator, never inside "8 rounds".
function progressLine(
	closed: DeskClosed,
	{ rounds, now }: { rounds: number; now: number },
): string {
	return [
		`Closed ${eventTime(closed.at, now)}`,
		`${closed.approvedFiles}/${closed.files} files approved`,
		rounds ? `${rounds} rounds` : null,
	]
		.filter(part => part !== null)
		.map(unbroken)
		.join(`${NO_BREAK}· `)
}

// How a closed row reads where it sits: whether it names its repository (not under a group
// that already does), and whether it just closed (it lands on the arrival wash).
export type ClosedLook = {
	isProjectNamed?: boolean | undefined
	isFresh?: boolean | undefined
}

const LISTED_LOOK: ClosedLook = { isProjectNamed: true }

// One closed desk, its Reopen at the end. Its list (or the group around it) is the `closed`
// container its narrow layout reads.
export function ClosedRow({
	closed,
	rounds,
	now,
	reopen,
	look = LISTED_LOOK,
}: {
	closed: DeskClosed
	rounds: number
	now: number
	reopen: Reopen
	look?: ClosedLook | undefined
}): ReactElement {
	const failure = reopen.failures.get(closed.deskId)
	// Named as the desk was while it was live (format.ts modeParts).
	const what = [
		...(look.isProjectNamed === true ? [closed.project] : []),
		...modeParts(closed),
	].join(' · ')
	return (
		<li
			{...stylex.props(
				closedList.row,
				look.isFresh === true && deskArrival.row,
			)}
			data-enter="rise"
		>
			<LiveDot hollow />
			<div>
				<p {...stylex.props(closedList.name)}>{closed.session}</p>
				<p {...stylex.props(closedList.meta)}>{what}</p>
			</div>
			<p {...stylex.props(closedList.progress)}>
				{progressLine(closed, { rounds, now })}
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
	const rounds = latestRounds(events)
	return (
		<section
			{...stylex.props(closedList.root)}
			aria-labelledby="closed-title"
			data-enter="fade"
		>
			<div {...stylex.props(closedList.head)}>
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
						rounds={rounds.get(entry.deskId) ?? 0}
						now={now}
						reopen={reopen}
					/>
				))}
			</ul>
		</section>
	)
}
