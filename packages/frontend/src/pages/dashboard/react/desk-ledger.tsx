import { useId, useRef } from 'react'

import { useFlip } from '@shared/lib/use-flip'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { LTR_MARK, plural } from '../format'
import { useTurnFlash } from '../use-turn-flash'

import { deskLedger } from './desk-ledger.styles'
import { DeskRow } from './desk-row'

import type { HubDesk } from '@entities/hub/model'
import type { DotTone } from '@shared/ui/live-dot'
import type { ReactElement } from 'react'
import type { WaitingSince } from '../overview/groups'
import type { DeskClose } from '../use-desk-close'

// One group of the ledger: its name, what it means (a turn's note) or where it is (a
// project's path), the square of its turn, and its desks in display order.
export type LedgerGroup = {
	key: string
	title: string
	meta?: string | undefined
	note?: string | undefined
	dot?: { tone: DotTone; isHollow: boolean } | undefined
	desks: readonly HubDesk[]
}

// What every row of the ledger reads besides its desk: the clock, whether the hub answers
// (squares pulse only then), the desks that just arrived, and the closes.
export type LedgerContext = {
	now: number
	isLive: boolean
	arrivedIds: ReadonlySet<string>
	close: DeskClose
	since: WaitingSince
}

function GroupHead({
	group,
	headingId,
}: {
	group: LedgerGroup
	headingId: string
}): ReactElement {
	return (
		<div {...stylex.props(deskLedger.head)}>
			{group.dot && (
				<LiveDot
					tone={group.dot.tone}
					hollow={group.dot.isHollow}
					css={deskLedger.dot}
				/>
			)}
			<h2 id={headingId} {...stylex.props(deskLedger.title)}>
				{group.title}
			</h2>
			<span {...stylex.props(deskLedger.count)}>
				{plural(group.desks.length, 'desk')}
			</span>
			{group.meta && (
				<span {...stylex.props(deskLedger.meta)} title={group.meta}>
					{`${LTR_MARK}${group.meta}${LTR_MARK}`}
				</span>
			)}
			{group.note && (
				<p {...stylex.props(deskLedger.note)}>{group.note}</p>
			)}
		</div>
	)
}

function LedgerSection({
	group,
	headingId,
	listed,
	context,
}: {
	group: LedgerGroup
	headingId: string
	// Every group's desks in display order: where focus goes once a closed row leaves.
	listed: readonly (readonly HubDesk[])[]
	context: LedgerContext
}): ReactElement {
	return (
		<section
			aria-labelledby={headingId}
			data-enter="fade"
			{...stylex.props(deskLedger.group)}
		>
			<GroupHead group={group} headingId={headingId} />
			<ul>
				{group.desks.map(desk => (
					<DeskRow
						key={desk.id}
						desk={desk}
						now={context.now}
						look={{
							isLive: context.isLive,
							hasArrived: context.arrivedIds.has(desk.id),
						}}
						close={{
							state: context.close.stateOf(desk.id),
							actions: context.close.actionsFor(desk, listed),
						}}
						since={context.since(desk)}
					/>
				))}
			</ul>
		</section>
	)
}

// The desks as ruled groups of rows (each row the desk's link, its stage, its review and its
// close). A desk whose group changes between two listings slides to its new place.
export function DeskLedger({
	groups,
	context,
	emptyText,
}: {
	groups: readonly LedgerGroup[]
	context: LedgerContext
	emptyText: string
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	const baseId = useId()
	useFlip(root)
	const listed = groups.map(group => group.desks)
	useTurnFlash(root, listed.flat())
	return (
		<div ref={root} {...stylex.props(deskLedger.root)}>
			{!groups.length && (
				<p {...stylex.props(deskLedger.empty)}>{emptyText}</p>
			)}
			{groups.map(group => (
				<LedgerSection
					key={group.key}
					group={group}
					headingId={`${baseId}-${group.key}`}
					listed={listed}
					context={context}
				/>
			))}
		</div>
	)
}
