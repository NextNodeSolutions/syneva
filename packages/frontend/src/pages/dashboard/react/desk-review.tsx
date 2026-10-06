import { a11y } from '@shared/ui/a11y.styles'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'

import { DeskApprovals } from './desk-approvals'
import { deskReview } from './desk-review.styles'
import { Fraction } from './fraction'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

// What is decided and what is still open on the desk: changes decided over changes (when the
// desk has any), the changes the reviewer asked for, the questions still open. Each item is
// keyed, so the line renders them as they come.
function progressItems(desk: HubDesk): ReactElement[] {
	const decided = desk.totalChanges > 0 && (
		<span key="decided" {...stylex.props(deskReview.item)}>
			<span>
				<Fraction
					count={desk.decidedChanges}
					total={desk.totalChanges}
				/>{' '}
				decided
				<span {...stylex.props(a11y.srOnly)}>
					{desk.totalChanges === 1 ? ' change' : ' changes'}
				</span>
			</span>
		</span>
	)
	const requests = desk.openRequests > 0 && (
		<span
			key="requests"
			{...stylex.props(deskReview.item, deskReview.requests)}
		>
			<LiveDot tone="amber" />
			{desk.openRequests} requested
		</span>
	)
	const questions = desk.openQuestions > 0 && (
		<span
			key="questions"
			{...stylex.props(deskReview.item, deskReview.questions)}
		>
			<LiveDot tone="petrol" hollow />
			{plural(desk.openQuestions, 'question')}
		</span>
	)
	return [decided, requests, questions].filter(
		(shown): shown is ReactElement => shown !== false,
	)
}

// The review cell: approvals on one line, progress on the next (when there is any). A screen
// reader hears the row through its link's description (row-description.ts), in sentences.
export function DeskReview({ desk }: { desk: HubDesk }): ReactElement {
	const items = progressItems(desk)
	return (
		<div {...stylex.props(deskReview.cell)}>
			<DeskApprovals desk={desk} />
			{items.length > 0 && (
				<p {...stylex.props(deskReview.progress)}>{items}</p>
			)}
		</div>
	)
}
