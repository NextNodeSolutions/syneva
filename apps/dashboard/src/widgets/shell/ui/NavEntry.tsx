import { AppLink } from '@shared/router/AppLink'
import { Icon } from '@shared/ui/Icon'
import * as stylex from '@stylexjs/stylex'

import { navEntry } from './nav-entry.styles'

import type { IconName } from '@syneva/design-system/icons'
import type { ReactElement, ReactNode } from 'react'

type NavEntryProps = {
	to: string
	icon: IconName
	isCurrent: boolean
	count?: number | undefined
	children: ReactNode
}

export function NavEntry({
	to,
	icon,
	isCurrent,
	count,
	children,
}: NavEntryProps): ReactElement {
	return (
		<li>
			<AppLink
				to={to}
				aria-current={isCurrent ? 'page' : undefined}
				{...stylex.props(navEntry.link, isCurrent && navEntry.current)}
			>
				<Icon name={icon} />
				<span {...stylex.props(navEntry.label)}>{children}</span>
				{typeof count === 'number' && (
					<span {...stylex.props(navEntry.count)}>{count}</span>
				)}
			</AppLink>
		</li>
	)
}
