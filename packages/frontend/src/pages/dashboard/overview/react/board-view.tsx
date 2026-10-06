import { useRef } from 'react'

import { TURNS, turnOf } from '@entities/hub/turn'
import { useFlip } from '@shared/lib/use-flip'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { HoldList } from '../../react/hold-list'
import { useHeldOrder } from '../../use-held-order'
import { TURN_COPY } from '../turn-copy'

import { board } from './board.styles'
import { DeskCard } from './desk-card'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { ReactElement } from 'react'
import type { ListedGroups } from '../../focus-after-close'
import type { LedgerContext } from '../../react/desk-ledger'
import type { ListHold } from '../../use-list-hold'

type BoardViewProps = {
	desks: readonly HubDesk[]
	// The clock, whether the hub answers, the closes: what a ledger reads besides its desks.
	context: LedgerContext
	// What holds the cards' order still: the pointer or focus in the board, an armed close.
	hold: { list: ListHold; isHeld: boolean }
}

function BoardColumn({
	turn,
	desks,
	columns,
	context,
}: {
	turn: Turn
	desks: readonly HubDesk[]
	// Every column's cards in display order: where focus goes once a closed card leaves.
	columns: ListedGroups
	context: LedgerContext
}): ReactElement {
	const copy = TURN_COPY[turn]
	const isPulsing = context.isLive && copy.dot.isLive && desks.length > 0
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
					live={isPulsing}
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
					now={context.now}
					since={context.since(desk)}
					close={{
						state: context.close.stateOf(desk.id),
						actions: context.close.actionsFor(desk, columns),
					}}
				/>
			))}
		</section>
	)
}

// The board: a column per turn, each desk a card in the column of whoever moves next. When a
// desk's turn changes, its card travels to its new column. Its cards hold their order while
// the reviewer is at them (use-held-order.ts), as the ledger's rows do.
export function BoardView(props: BoardViewProps): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useFlip(root)
	const { since } = props.context
	const sorted = props.desks.toSorted((a, b) =>
		since(a).localeCompare(since(b)),
	)
	// Every turn is a column, even an empty one, so the held order keeps the four in TURNS order.
	const held = useHeldOrder(
		TURNS.map(turn => ({
			key: turn,
			desks: sorted.filter(desk => turnOf(desk) === turn),
		})),
		{ isHeld: props.hold.isHeld },
	)
	const columns = held.map(column => column.desks)
	return (
		<HoldList hold={props.hold.list} css={board.root}>
			<div ref={root} {...stylex.props(board.columns)}>
				{held.map(column => (
					<BoardColumn
						key={column.key}
						turn={column.key}
						desks={column.desks}
						columns={columns}
						context={props.context}
					/>
				))}
			</div>
		</HoldList>
	)
}
