import { HUB_PAGES } from '@entities/hub/api'
import { Brand } from '@shared/ui/brand'
import { Button } from '@shared/ui/button'
import { TextLink } from '@shared/ui/text-link'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { NEW_REVIEW_ID } from '../focus-targets'

import { hubHeader } from './hub-header.styles'

import type { ReactElement } from 'react'

// The page's header: the brand home, then Sign out (only on a hub started with a key, once
// its health says so) and the one New review action, which also answers to N (40px tall from
// tablets held upright down, for a finger). Null
// `onNewReview`: the page offers no New review (a signed-out browser).
export function HubHeader({
	canSignOut,
	onNewReview,
}: {
	canSignOut: boolean
	onNewReview: (() => void) | null
}): ReactElement {
	return (
		<header {...stylex.props(hubHeader.root)}>
			<Brand
				href={HUB_PAGES.home}
				label="Syneva hub, all desks"
				product="hub"
				current
			/>
			<div {...stylex.props(hubHeader.actions)}>
				{canSignOut && (
					<TextLink href={HUB_PAGES.signOut} small>
						Sign out
					</TextLink>
				)}
				{onNewReview && (
					<Button
						id={NEW_REVIEW_ID}
						tone="outlined"
						kbd="N"
						aria-keyshortcuts="N"
						css={touchTarget.regular}
						onClick={onNewReview}
					>
						New review
					</Button>
				)}
			</div>
		</header>
	)
}
