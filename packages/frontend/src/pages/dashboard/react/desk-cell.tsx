import { a11y } from '@shared/ui/a11y.styles'
import { run } from '@shared/ui/run.styles'
import * as stylex from '@stylexjs/stylex'

import { deskLinkId } from '../focus-targets'
import { modeParts, relativeTime, unbroken } from '../format'

import { deskCell } from './desk-cell.styles'
import { deskLinkMarker } from './desk-row.stylex'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

type DeskCellProps = {
	desk: HubDesk
	now: number
	// The id of the row's description, the sentence a screen reader hears on the link.
	describedBy: string
}

// The desk's title, which is the row's link: a span stretched over the row makes the whole
// row open the desk (same tab; a modified click opens a new one natively) and draws its focus
// ring. Under it, its repository and what it reviews, as a run of parts that breaks only
// between them; when it opened is said to screen readers only (how long its turn has lasted
// is the stage's to say).
export function DeskCell({
	desk,
	now,
	describedBy,
}: DeskCellProps): ReactElement {
	const [kind = '', detail] = modeParts(desk)
	const part = stylex.props(run.part)
	const modePart = stylex.props(run.part, deskCell.metaMode)
	return (
		<div {...stylex.props(deskCell.cell)}>
			<h3 {...stylex.props(deskCell.title)}>
				<a
					id={deskLinkId(desk.id)}
					href={desk.path}
					aria-describedby={describedBy}
					{...stylex.props(deskCell.link, deskLinkMarker)}
				>
					{desk.session}
					<span
						{...stylex.props(deskCell.stretch)}
						aria-hidden="true"
					/>
				</a>
			</h3>
			<p {...stylex.props(deskCell.meta, run.clip)}>
				<span {...stylex.props(run.parts)}>
					<span {...part}>{unbroken(desk.project)}</span>
					<span {...modePart}>{unbroken(kind)}</span>
					{detail && <span {...modePart}>{unbroken(detail)}</span>}
				</span>
				<span {...stylex.props(a11y.srOnly)}>
					{` · opened ${relativeTime(desk.openedAt, now)}`}
				</span>
			</p>
		</div>
	)
}
