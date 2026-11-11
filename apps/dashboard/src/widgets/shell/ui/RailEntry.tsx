import { AppLink } from '@shared/router/AppLink'
import { Icon } from '@shared/ui/Icon'
import * as stylex from '@stylexjs/stylex'

import { railEntry } from './rail-entry.styles'

import type { IconName } from '@syneva/design-system/icons'
import type { ReactElement } from 'react'

type RailEntryProps = {
	to: string
	icon: IconName
	label: string
	isCurrent: boolean
}

export function RailEntry({
	to,
	icon,
	label,
	isCurrent,
}: RailEntryProps): ReactElement {
	return (
		<li>
			<AppLink
				to={to}
				title={label}
				aria-label={label}
				aria-current={isCurrent ? 'page' : undefined}
				{...stylex.props(
					railEntry.link,
					isCurrent && railEntry.current,
				)}
			>
				<Icon name={icon} />
			</AppLink>
		</li>
	)
}
