import { useRef } from 'react'

import { TURNS, turnOf } from '@entities/hub/turn'
import { useFlip } from '@shared/lib/use-flip'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { TURN_COPY } from '../turn-copy'

import { board } from './board.styles'
import { DeskCard } from './desk-card'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { ReactElement } from 'react'
import type { ListedGroups } from '../../focus-after-close'
import type { DeskClose } from '../../use-desk-close'
import type { WaitingSince } from '../groups'

type BoardViewProps = {
	desks: readonly HubDesk[]
	now: number
	isLive: boolean
	since: WaitingSince
	close: DeskClose
}

function BoardColumn({
	turn,
	desks,
	columns,
	props,
}: {
	turn: Turn
	desks: readonly HubDesk[]
	// Every column's cards in display order: where focus goes once a closed card leaves.
	columns: ListedGroups
	props: BoardViewProps
}): ReactElement {
	const copy = TURN_COPY[turn]
	return (
		<section
			aria-label={`${copy.heading}: ${desks.length}`}
			data-enter="fade"
			{...stylex.props(
				board.column,
				turn === 'yours' && board.columnYours,
			)}
		>
			<h2 {...stylex.props(board.head)}>
				<LiveDot
					tone={copy.dot.tone}
					hollow={copy.dot.isHollow}
					live={props.isLive && copy.dot.isLive && desks.length > 0}
				/>
				{copy.heading}
				<span {...stylex.props(board.count)}>{desks.length}</span>
			</h2>
			{!desks.length && (
				<p {...stylex.props(board.empty)}>Nothing here</p>
			)}
			{desks.map(desk => (
				<DeskCard
					key={desk.id}
					desk={desk}
					now={props.now}
					since={props.since(desk)}
					close={{
						state: props.close.stateOf(desk.id),
						actions: props.close.actionsFor(desk, columns),
					}}
				/>
			))}
		</section>
	)
}

// The board: a column per turn, each desk a card in the column of whoever moves next. When a
// desk's turn changes, its card travels to its new column.
export function BoardView(props: BoardViewProps): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useFlip(root)
	const sorted = props.desks.toSorted((a, b) =>
		props.since(a).localeCompare(props.since(b)),
	)
	const columns = TURNS.map(turn =>
		sorted.filter(desk => turnOf(desk) === turn),
	)
	return (
		<div ref={root} {...stylex.props(board.root)}>
			<div {...stylex.props(board.columns)}>
				{TURNS.map((turn, index) => (
					<BoardColumn
						key={turn}
						turn={turn}
						desks={columns[index] ?? []}
						columns={columns}
						props={props}
					/>
				))}
			</div>
		</div>
	)
}
