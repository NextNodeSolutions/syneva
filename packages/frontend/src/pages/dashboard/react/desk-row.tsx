import { deskStage } from '@entities/hub/stage'
import { ArrowRight } from '@shared/ui/arrow-right'
import { LineIcon } from '@shared/ui/line-icon'
import * as stylex from '@stylexjs/stylex'

import { deskCloseId, deskKeepId } from '../focus-targets'
import { modeKeyOf } from '../overview/display'
import { rowDescription } from '../row-description'
import { stageCopy } from '../stage-copy'
import { turnLasted } from '../turn-age'

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
import type { ModeKey } from '../overview/display'
import type { CloseActions, CloseState } from '../use-desk-close'

type DeskRowProps = {
	desk: HubDesk
	now: number
	// The listing is stale (no pulses) / the desk just arrived (the tint fades out of it).
	look: { isLive: boolean; hasArrived: boolean }
	close: { state: CloseState; actions: CloseActions }
	// When the desk's current turn began (every display reads the same time).
	since: string
}

// The site's line icon for what the desk reviews.
const MODE_ICONS: Record<ModeKey, IconName> = {
	working: 'tree',
	staged: 'staged',
	file: 'file',
	pr: 'branch',
}

// The row's end: Close (armed, Close desk and Keep), then Open, the row's way in, which the
// whole row's link carries; the word and its arrow say so where the eye ends the line.
function RowEnd({
	desk,
	close,
	warningId,
}: {
	desk: HubDesk
	close: DeskRowProps['close']
	warningId: string
}): ReactElement {
	return (
		<>
			<CloseControl
				session={desk.session}
				state={close.state}
				ids={{
					close: deskCloseId(desk.id),
					keep: deskKeepId(desk.id),
					warning: warningId,
				}}
				actions={close.actions}
			/>
			{close.state === 'rest' && (
				<span {...stylex.props(deskRow.open)} aria-hidden="true">
					Open
					<ArrowRight css={deskRow.arrow} />
				</span>
			)}
		</>
	)
}

function rowIds(deskId: string): { description: string; warning: string } {
	return {
		description: `desk-${deskId}-description`,
		warning: `desk-${deskId}-warning`,
	}
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
	since,
}: DeskRowProps): ReactElement {
	const ids = rowIds(desk.id)
	const copy = stageCopy(deskStage(desk))
	const isArmed = close.state !== 'rest'
	return (
		<li
			data-flip={desk.id}
			data-enter="rise"
			{...stylex.props(
				deskRow.row,
				isArmed && deskRow.armed,
				look.hasArrived && deskArrival.row,
				deskRowMarker,
			)}
		>
			<LineIcon name={MODE_ICONS[modeKeyOf(desk)]} css={deskRow.icon} />
			<DeskCell desk={desk} now={now} describedBy={ids.description} />
			<span id={ids.description} hidden>
				{rowDescription(desk, copy, now)}
			</span>
			<DeskStage
				copy={copy}
				age={turnLasted(since, now)}
				isLive={look.isLive}
			/>
			{isArmed ? (
				<CloseWarning
					id={ids.warning}
					isAgentListening={desk.agentListening}
				/>
			) : (
				<DeskReview desk={desk} />
			)}
			<RowEnd desk={desk} close={close} warningId={ids.warning} />
		</li>
	)
}
