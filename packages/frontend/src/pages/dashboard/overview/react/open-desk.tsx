import { Button } from '@shared/ui/button'
import { Code } from '@shared/ui/code'
import { CommandChip } from '@shared/ui/command-chip'
import { TextLink } from '@shared/ui/text-link'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { deskLedger } from '../../react/desk-ledger.styles'
import { openSentences } from '../open-copy'

import { emptyOverview } from './empty-overview.styles'

import type { HubPlace } from '@entities/hub/hub-place'
import type { ReactElement } from 'react'

const SETUP_GUIDE = 'https://syneva.dev/get-started/'

const TITLE_ID = 'open-desk-title'

// The command ready to copy, then New review from here and the setup guide.
function OpenWays({
	onNewReview,
}: {
	onNewReview: (() => void) | null
}): ReactElement {
	return (
		<div {...stylex.props(emptyOverview.ways)}>
			<div {...stylex.props(emptyOverview.command)}>
				<CommandChip
					command="syneva open"
					label="Command to open a desk"
					block
				/>
			</div>
			<div {...stylex.props(emptyOverview.actions)}>
				{onNewReview && (
					<Button
						kbd="N"
						aria-keyshortcuts="N"
						css={touchTarget.regular}
						onClick={onNewReview}
					>
						<ShellIcon name="plus" />
						New review
					</Button>
				)}
				<TextLink href={SETUP_GUIDE} external small>
					Setup guide
				</TextLink>
			</div>
		</div>
	)
}

// The way a desk opens, as a ledger group of its own: who runs the command and where, the
// command ready to copy, New review from here, and the setup guide. A key-protected hub says
// where its key goes (never the key itself).
export function OpenDesk({
	place,
	isKeyed,
	isStale,
	onNewReview,
}: {
	place: HubPlace
	isKeyed: boolean
	isStale: boolean
	onNewReview: (() => void) | null
}): ReactElement {
	const copy = openSentences(place, { isStale })
	return (
		<section aria-labelledby={TITLE_ID} data-enter="rise">
			<div {...stylex.props(deskLedger.head)}>
				<h2 id={TITLE_ID} {...stylex.props(deskLedger.title)}>
					Open a desk
				</h2>
			</div>
			<p {...stylex.props(emptyOverview.lede)}>
				{copy.run}
				{isKeyed && (
					<>
						{' This hub asks for its access key: set '}
						<Code>SYNEVA_KEY</Code>
						{' where the command runs.'}
					</>
				)}
				{` ${copy.next}`}
			</p>
			<OpenWays onNewReview={onNewReview} />
		</section>
	)
}
