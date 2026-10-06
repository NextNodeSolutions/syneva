import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { textLinkMarker } from '@syneva/design-system/controls.stylex'
import { textLink } from '@syneva/design-system/inline.styles'

import { a11y } from './a11y.styles'

import type { ReactElement, ReactNode } from 'react'

type TextLinkLook = {
	small?: boolean | undefined
	onWash?: boolean | undefined
}

type TextLinkProps = TextLinkLook & {
	href: string
	children: ReactNode
	external?: boolean | undefined
	arrow?: boolean | undefined
}

export function TextLink({
	href,
	children,
	external,
	arrow,
	...look
}: TextLinkProps): ReactElement {
	const isExternal = external === true
	return (
		<a
			{...stylex.props(
				focus.ring,
				textLink.base,
				look.small === true && textLink.small,
				look.onWash === true && textLink.onWash,
				textLinkMarker,
			)}
			href={href}
			target={isExternal ? '_blank' : undefined}
			rel={isExternal ? 'noopener noreferrer' : undefined}
		>
			{children}
			{(isExternal || arrow === true) && (
				<span {...stylex.props(textLink.arrow)} aria-hidden="true">
					{isExternal ? '↗' : '→'}
				</span>
			)}
			{isExternal && (
				<span {...stylex.props(a11y.srOnly)}>
					{' '}
					(opens in a new tab)
				</span>
			)}
		</a>
	)
}
