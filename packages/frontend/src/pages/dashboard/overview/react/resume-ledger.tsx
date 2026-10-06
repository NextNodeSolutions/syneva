import { useId } from 'react'

import { roundsOf } from '@entities/hub/journal-stats'
import { AppLink } from '@shared/ui/app-link'
import { ArrowRight } from '@shared/ui/arrow-right'
import { Button } from '@shared/ui/button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'
import { focus } from '@syneva/design-system/controls.styles'
import { textLinkMarker } from '@syneva/design-system/controls.stylex'
import { textLink } from '@syneva/design-system/inline.styles'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { displayRoot, LTR_MARK } from '../../format'
import { ClosedRow } from '../../react/closed-desks'
import { deskLedger } from '../../react/desk-ledger.styles'
import { useReopen } from '../../use-reopen'

import { resumeLedger } from './empty-overview.styles'

import type { JournalEvent } from '@entities/hub/journal'
import type { ReactElement } from 'react'
import type { Reopen } from '../../use-reopen'
import type { Resume, ResumeGroup } from '../resume'

type OfferIn = ((root: string) => void) | null

const RECENT_ID = 'recently-closed'

// What every closed row reads besides its desk: the rounds it went through, the clock, the one
// reopen in flight, and where the events that just arrived begin.
type RowContext = {
	events: readonly JournalEvent[]
	now: number
	reopen: Reopen
	freshAfter: number
}

function GroupHead({
	group,
	headingId,
	onNewReviewIn,
}: {
	group: ResumeGroup
	headingId: string
	onNewReviewIn: OfferIn
}): ReactElement {
	return (
		<div {...stylex.props(deskLedger.head)}>
			<h3 id={headingId} {...stylex.props(deskLedger.title)}>
				{group.project}
			</h3>
			<span {...stylex.props(deskLedger.count)}>
				{`${group.total} closed`}
			</span>
			<span
				{...stylex.props(deskLedger.meta, resumeLedger.path)}
				title={group.root}
			>
				{`${LTR_MARK}${displayRoot(group.root)}${LTR_MARK}`}
			</span>
			{onNewReviewIn && (
				<Button
					tone="quiet"
					size="small"
					css={[touchTarget.small, resumeLedger.newReview]}
					aria-label={`New review in ${group.project}`}
					onClick={() => onNewReviewIn(group.root)}
				>
					<ShellIcon name="plus" />
					New review
				</Button>
			)}
		</div>
	)
}

function ResumeGroupSection({
	group,
	context,
	onNewReviewIn,
}: {
	group: ResumeGroup
	context: RowContext
	onNewReviewIn: OfferIn
}): ReactElement {
	const headingId = useId()
	return (
		<section
			aria-labelledby={headingId}
			data-enter="fade"
			{...stylex.props(resumeLedger.group)}
		>
			<GroupHead
				group={group}
				headingId={headingId}
				onNewReviewIn={onNewReviewIn}
			/>
			<ul>
				{group.desks.map(desk => (
					<ClosedRow
						key={desk.deskId}
						closed={desk}
						rounds={roundsOf(context.events, desk.deskId)}
						now={context.now}
						reopen={context.reopen}
						look={{ isFresh: desk.seq > context.freshAfter }}
					/>
				))}
			</ul>
		</section>
	)
}

// Every closed desk is on Reviews, past the rows kept here.
function AllClosed({ total }: { total: number }): ReactElement {
	return (
		<AppLink
			href={DASHBOARD_PATHS.reviews}
			css={[focus.ring, textLink.base, textLink.small, textLinkMarker]}
		>
			{`All ${total} closed desks`}
			<ArrowRight css={[textLink.arrow, resumeLedger.allArrow]} />
		</AppLink>
	)
}

// The desks closed before, by repository, each one click from back (Reopen) and each
// repository one click from a new review; the rest one link away, on Reviews. A desk closed
// past `freshAfter` lands on the arrival wash.
export function ResumeLedger({
	resume,
	events,
	freshAfter,
	now,
	onNewReviewIn,
}: {
	resume: Resume
	events: readonly JournalEvent[]
	freshAfter: number
	now: number
	onNewReviewIn: OfferIn
}): ReactElement {
	// One reopen state for the ledger: a single desk reopens at a time.
	const reopen = useReopen()
	const context: RowContext = { events, now, reopen, freshAfter }
	return (
		<section
			aria-labelledby={RECENT_ID}
			{...stylex.props(resumeLedger.root)}
		>
			<div {...stylex.props(resumeLedger.head)} data-enter="fade">
				<h2 id={RECENT_ID} {...stylex.props(resumeLedger.heading)}>
					Recently closed
				</h2>
				{resume.total > resume.shown && (
					<AllClosed total={resume.total} />
				)}
			</div>
			{resume.groups.map(group => (
				<ResumeGroupSection
					key={group.projectId}
					group={group}
					context={context}
					onNewReviewIn={onNewReviewIn}
				/>
			))}
		</section>
	)
}
