import { deskStage } from '@entities/hub/stage'
import { ArrowRight } from '@shared/ui/arrow-right'
import { LineIcon } from '@shared/ui/line-icon'
import * as stylex from '@stylexjs/stylex'

import { deskCloseId, deskKeepId } from '../focus-targets'
import { rowDescription } from '../row-description'
import { stageCopy } from '../stage-copy'

import { CloseControl } from './close-control'
import { CloseWarning } from './close-warning'
import { DeskCell } from './desk-cell'
import { DeskReview } from './desk-review'
import { deskArrival, deskRow } from './desk-row.styles'
import { deskRowMarker } from './desk-row.stylex'
import { DeskStage } from './desk-stage'

import type { HubDesk } from '@entities/hub/model'
import type { IconName } from '@syneva/design-system/icons'
import type { ReactElement } from 'react'
import type { CloseActions, CloseState } from '../use-desk-close'

type DeskRowProps = {
	desk: HubDesk
	now: number
	// The listing is stale (no pulses) / the desk just arrived (the tint fades out of it).
	look: { isLive: boolean; hasArrived: boolean }
	close: { state: CloseState; actions: CloseActions }
}

// The site's line icon for what the desk reviews.
function iconOf(desk: HubDesk): IconName {
	if (desk.mode === 'file') return 'file'
	if (desk.mode === 'pr') return 'branch'
	return desk.staged ? 'staged' : 'tree'
}

// One desk as the site's index row: icon, desk, stage, review, actions and the arrow; one
// tab stop for the link, one for Close. The link is described by the row in sentences (a
// hidden element: a reference reads it, browsing skips it). While its close is armed, the
// warning takes the review's place and describes Close desk and Keep.
export function DeskRow({
	desk,
	now,
	look,
	close,
}: DeskRowProps): ReactElement {
	const ids = {
		description: `desk-${desk.id}-description`,
		warning: `desk-${desk.id}-warning`,
	}
	const copy = stageCopy(deskStage(desk))
	const isArmed = close.state !== 'rest'
	return (
		<li
			{...stylex.props(
				deskRow.row,
				isArmed && deskRow.armed,
				look.hasArrived && deskArrival.row,
				deskRowMarker,
			)}
		>
			<LineIcon name={iconOf(desk)} css={deskRow.icon} />
			<DeskCell desk={desk} now={now} describedBy={ids.description} />
			<span id={ids.description} hidden>
				{rowDescription(desk, copy, now)}
			</span>
			<DeskStage copy={copy} now={now} isLive={look.isLive} />
			{isArmed ? (
				<CloseWarning
					id={ids.warning}
					isAgentListening={desk.agentListening}
				/>
			) : (
				<DeskReview desk={desk} />
			)}
			<CloseControl
				session={desk.session}
				state={close.state}
				ids={{
					close: deskCloseId(desk.id),
					keep: deskKeepId(desk.id),
					warning: ids.warning,
				}}
				actions={close.actions}
			/>
			<ArrowRight css={deskRow.arrow} />
		</li>
	)
}
