import { Kbd } from '@shared/ui/kbd'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { sidebar } from './hub-sidebar.styles'
import { railTip } from './rail-tip.styles'
import { ShellIcon } from './shell-icon'
import { sidebarParts } from './sidebar-parts.styles'

import type { ReactElement } from 'react'

// The one action the shell always offers: open a desk from here, as the CLI does. It answers
// to N anywhere on the dashboard (the page binds the key); folded, it is the plus on the rail.
export function NewReviewEntry({
	id,
	isFolded,
	onOpen,
}: {
	id: string
	isFolded: boolean
	onOpen: () => void
}): ReactElement {
	return (
		<button
			type="button"
			id={id}
			aria-keyshortcuts="N"
			aria-label={isFolded ? 'New review' : undefined}
			data-tip={isFolded ? 'New review (N)' : undefined}
			data-enter="fade"
			onClick={onOpen}
			{...stylex.props(
				press.control,
				control.base,
				control.outlined,
				control.small,
				sidebarParts.newReview,
				isFolded && railTip.host,
			)}
		>
			<ShellIcon name="plus" />
			<span
				{...stylex.props(
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				New review
			</span>
			<Kbd
				keys="N"
				css={[
					sidebarParts.newReviewKey,
					sidebar.label,
					isFolded && sidebar.labelFolded,
				]}
			/>
		</button>
	)
}
