import * as stylex from '@stylexjs/stylex'
import { press } from '@syneva/design-system/press.styles'

import { account } from './account.styles'

import type { ComponentPropsWithRef, ReactElement } from 'react'

type ActionButtonProps = ComponentPropsWithRef<'button'> & {
	tone?: 'primary' | 'secondary'
}

export function ActionButton({
	tone = 'primary',
	...props
}: ActionButtonProps): ReactElement {
	return (
		<button
			type="button"
			{...props}
			{...stylex.props(
				press.control,
				account.button,
				tone === 'secondary' && account.secondary,
			)}
		/>
	)
}
