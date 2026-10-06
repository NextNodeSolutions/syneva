import { HUB_PAGES } from '@entities/hub/api'
import { ButtonLink } from '@shared/ui/button-link'
import { CommandChip } from '@shared/ui/command-chip'
import * as stylex from '@stylexjs/stylex'

import { headCopy } from '../head-copy'
import { hubPlace } from '@entities/hub/hub-place'

import { hubHead } from './hub-head.styles'

import type { ReactElement, ReactNode } from 'react'
import type { HeadCopy } from '../head-copy'
import type { HubPhase } from '../hub-phase'

const HEAD_ACTIONS: Record<NonNullable<HeadCopy['action']>, ReactElement> = {
	'start-hub': (
		<CommandChip command="syneva start" label="Command to start the hub" />
	),
	'sign-in': (
		<ButtonLink tone="primary" size="large" arrow href={HUB_PAGES.signIn}>
			Sign in
		</ButtonLink>
	),
}

const TITLE_ID = 'hub-title'

// The page's head: the statement of where the reviewer stands (the one h1, never a live
// region: a poll must not re-announce it), its lede and the action the phase asks for; the
// register, when there is one, comes in as the right-hand column. Alone on the page, it drops
// the rule that parts it from a listing.
export function HubHead({
	phase,
	children,
}: {
	phase: HubPhase
	children?: ReactNode
}): ReactElement {
	const copy = headCopy(phase, hubPlace())
	return (
		<section
			{...stylex.props(
				hubHead.root,
				copy.isAlone === true && hubHead.alone,
			)}
			aria-labelledby={TITLE_ID}
		>
			<div {...stylex.props(hubHead.statement)}>
				<h1
					id={TITLE_ID}
					{...stylex.props(
						hubHead.title,
						copy.isPending === true && hubHead.pending,
					)}
				>
					{copy.title}
				</h1>
				{copy.lede && (
					<p {...stylex.props(hubHead.lede)}>{copy.lede}</p>
				)}
				{copy.action && (
					<div {...stylex.props(hubHead.action)}>
						{HEAD_ACTIONS[copy.action]}
					</div>
				)}
			</div>
			{children && (
				<div {...stylex.props(hubHead.register)}>{children}</div>
			)}
		</section>
	)
}
