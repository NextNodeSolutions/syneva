import { Meter } from '@shared/ui/meter'
import * as stylex from '@stylexjs/stylex'

import { deskReview } from './desk-review.styles'
import { Fraction } from './fraction'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

// The files the reviewer signed off over the files in the review - the same "approved" the
// desk's own header counts, so the two never disagree. All of them is a verdict: green, ticked
// at the line's end, so the figure keeps the column every other row's figure starts on. A
// desk with no changes yet has no files to approve: a dashed meter and "0 files".
export function DeskApprovals({ desk }: { desk: HubDesk }): ReactElement {
	if (desk.empty)
		return (
			<p {...stylex.props(deskReview.approvals)}>
				<Meter max={0} />0 files
			</p>
		)
	const isDone = desk.files > 0 && desk.approvedFiles === desk.files
	return (
		<p {...stylex.props(deskReview.approvals, isDone && deskReview.done)}>
			<Meter value={desk.approvedFiles} max={desk.files} />
			<span>
				<Fraction
					count={desk.approvedFiles}
					total={desk.files}
					css={isDone && deskReview.done}
				/>{' '}
				{desk.files === 1 ? 'file' : 'files'} approved
				{isDone && <span aria-hidden="true"> ✓</span>}
			</span>
		</p>
	)
}
