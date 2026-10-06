import { deskStage } from '@entities/hub/stage'
import { ArrowRight } from '@shared/ui/arrow-right'
import { Meter } from '@shared/ui/meter'
import * as stylex from '@stylexjs/stylex'
import { focus, tag } from '@syneva/design-system/controls.styles'

import { deskCloseId, deskKeepId } from '../../focus-targets'
import { modeParts, plural } from '../../format'
import { CloseControl } from '../../react/close-control'
import { CloseWarning } from '../../react/close-warning'
import { Fraction } from '../../react/fraction'
import { rowDescription } from '../../row-description'
import { stageCopy } from '../../stage-copy'
import { turnAge } from '../../turn-age'

import { deskCard } from './desk-card.styles'
import { deskCardMarker } from './desk-card.stylex'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { CloseActions, CloseState } from '../../use-desk-close'

type CardClose = { state: CloseState; actions: CloseActions }

// The card's review, as a row of the ledger says it: the decided changes, the approved files,
// then what is still open.
function CardReview({ desk }: { desk: HubDesk }): ReactElement {
	return (
		<>
			<p {...stylex.props(deskCard.progress)}>
				<span {...stylex.props(deskCard.track)}>
					<Meter
						value={desk.decidedChanges}
						max={desk.totalChanges}
					/>
				</span>
				<span>
					<Fraction
						count={desk.decidedChanges}
						total={desk.totalChanges}
					/>{' '}
					decided
					{' · '}
					<Fraction
						count={desk.approvedFiles}
						total={desk.files}
					/>{' '}
					files
				</span>
			</p>
			{(desk.openQuestions > 0 || desk.openRequests > 0) && (
				<p {...stylex.props(deskCard.tags)}>
					{desk.openQuestions > 0 && (
						<span {...stylex.props(tag.base, tag.accent)}>
							{plural(desk.openQuestions, 'question')} open
						</span>
					)}
					{desk.openRequests > 0 && (
						<span {...stylex.props(tag.base, tag.amber)}>
							{plural(desk.openRequests, 'change')} requested
						</span>
					)}
				</p>
			)}
		</>
	)
}

// The card's foot: how long the turn has lasted, Close (armed, it asks first), and the way in.
function CardFoot({
	desk,
	waited,
	close,
}: {
	desk: HubDesk
	waited: string
	close: CardClose
}): ReactElement {
	const isArmed = close.state !== 'rest'
	return (
		<>
			{isArmed && (
				<CloseWarning
					id={`card-${desk.id}-warning`}
					isAgentListening={desk.agentListening}
				/>
			)}
			<div {...stylex.props(deskCard.foot)}>
				<span>{waited}</span>
				<span {...stylex.props(deskCard.end)}>
					<CloseControl
						session={desk.session}
						state={close.state}
						ids={{
							close: deskCloseId(desk.id),
							keep: deskKeepId(desk.id),
							warning: `card-${desk.id}-warning`,
						}}
						actions={close.actions}
					/>
					{!isArmed && (
						<span
							{...stylex.props(deskCard.open)}
							aria-hidden="true"
						>
							Open
							<ArrowRight css={deskCard.arrow} />
						</span>
					)}
				</span>
			</div>
		</>
	)
}

// The card's title, which is its link: the span stretched over the card makes the whole card
// open the desk and draws its focus ring.
function CardTitle({
	desk,
	descriptionId,
}: {
	desk: HubDesk
	descriptionId: string
}): ReactElement {
	return (
		<h3 {...stylex.props(deskCard.title)}>
			<a
				href={desk.path}
				aria-describedby={descriptionId}
				{...stylex.props(deskCard.link)}
			>
				{desk.session}
				<span
					{...stylex.props(focus.ring, deskCard.stretch)}
					aria-hidden="true"
				/>
			</a>
		</h3>
	)
}

// One desk on the board, holding what a row of the ledger holds: the whole card is its link (a
// modified click opens a new tab), read to a screen reader as the row's sentence. Its title,
// its repository and what it reviews, the agent's own words when it has posted some, the
// review's progress, what is open, then how long its turn has lasted, Close and the way in.
export function DeskCard({
	desk,
	now,
	since,
	close,
}: {
	desk: HubDesk
	now: number
	since: string
	close: CardClose
}): ReactElement {
	const copy = stageCopy(deskStage(desk))
	const descriptionId = `card-${desk.id}-description`
	const what = [desk.project, ...modeParts(desk)].filter(Boolean).join(' · ')
	return (
		<article
			data-flip={desk.id}
			data-enter="rise"
			{...stylex.props(deskCard.card, deskCardMarker)}
		>
			<CardTitle desk={desk} descriptionId={descriptionId} />
			<span id={descriptionId} hidden>
				{rowDescription(desk, copy, now)}
			</span>
			<p {...stylex.props(deskCard.meta)}>{what}</p>
			{copy.detail.kind === 'words' && (
				<p {...stylex.props(deskCard.words)}>
					<q>{copy.detail.body}</q>
				</p>
			)}
			<CardReview desk={desk} />
			<CardFoot
				desk={desk}
				waited={turnAge(desk, since, now)}
				close={close}
			/>
		</article>
	)
}
