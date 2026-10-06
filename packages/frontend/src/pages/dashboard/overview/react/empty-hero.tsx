import { Button } from '@shared/ui/button'
import { Code } from '@shared/ui/code'
import { CommandChip } from '@shared/ui/command-chip'
import { TextLink } from '@shared/ui/text-link'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { emptyOverview } from './empty-overview.styles'
import { LoopDiagram } from './loop-diagram'

import type { ReactElement } from 'react'

const SETUP_GUIDE = 'https://syneva.dev/get-started/'

export type HeroCopy = {
	title: string
	lead: string
	after: string
	// A key-protected hub says where its key goes (never the key itself).
	isKeyed: boolean
}

// The command ready to copy, New review from here, and the setup guide, on one centred line.
function HeroWays({
	onNewReview,
}: {
	onNewReview: (() => void) | null
}): ReactElement {
	return (
		<div {...stylex.props(emptyOverview.ways)} data-enter="rise">
			<div {...stylex.props(emptyOverview.command)}>
				<CommandChip
					command="syneva open"
					label="Command to open a desk"
					block
				/>
			</div>
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
	)
}

// The empty overview's head, centred on the page: the review loop at rest (how a desk goes
// round), the page's statement and what to do about it, and the ways to open a desk. Alone (no
// history yet), it stands in the middle of the page's height.
export function EmptyHero({
	copy,
	isAlone,
	onNewReview,
}: {
	copy: HeroCopy
	isAlone: boolean
	onNewReview: (() => void) | null
}): ReactElement {
	return (
		<header
			{...stylex.props(
				emptyOverview.hero,
				isAlone && emptyOverview.heroAlone,
			)}
		>
			<LoopDiagram />
			<h1 {...stylex.props(emptyOverview.title)} data-enter="rise">
				{copy.title}
			</h1>
			<p {...stylex.props(emptyOverview.lede)} data-enter="rise">
				{copy.lead}
				{copy.isKeyed && (
					<>
						{' This hub asks for its access key: set '}
						<Code>SYNEVA_KEY</Code>
						{' where the command runs.'}
					</>
				)}
				{copy.after && ` ${copy.after}`}
			</p>
			<HeroWays onNewReview={onNewReview} />
		</header>
	)
}
