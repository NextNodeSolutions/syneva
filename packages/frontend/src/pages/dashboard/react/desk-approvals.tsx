import { Meter } from '@shared/ui/meter'
import * as stylex from '@stylexjs/stylex'
import { a11y } from '@syneva/design-system/a11y.styles'

import { deskReview } from './desk-review.styles'
import { Fraction } from './fraction'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

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
				{desk.files === 1 ? 'file' : 'files'}
				<span {...stylex.props(a11y.srOnly)}> approved</span>
				{isDone && <span aria-hidden="true"> ✓</span>}
			</span>
		</p>
	)
}
