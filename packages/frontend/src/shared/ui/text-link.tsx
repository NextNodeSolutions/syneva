import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { textLinkMarker } from '@syneva/design-system/controls.stylex'
import { textLink } from '@syneva/design-system/inline.styles'

import { a11y } from './a11y.styles'

import type { ReactElement, ReactNode } from 'react'

// Where the link sits and how loud it speaks: a step smaller beside small
// controls, a petrol underline on a wash band.
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

// The secondary action: an underlined link. A link off the hub opens in a new
// tab and says so, with ↗ and in words a screen reader reads (the glyph is
// decoration); an internal one shows → only when `arrow` asks for it.
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
