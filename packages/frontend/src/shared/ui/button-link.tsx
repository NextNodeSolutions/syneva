import { ButtonFace } from './button-face'
import { lookProps, splitLook } from './button-look'

import type { ComponentPropsWithRef, ReactElement } from 'react'
import type { ButtonLook } from './button-look'

// A link that navigates cannot be busy or disabled: it takes the rest of the
// look.
type ButtonLinkProps = Omit<ButtonLook, 'busy' | 'busyLabel'> &
	Omit<ComponentPropsWithRef<'a'>, 'className' | 'style' | 'href'> & {
		href: string
	}

// A link dressed as a button, for an action that is a navigation (sign in,
// back to the desks): the same recipe, the same face.
export function ButtonLink({
	children,
	...props
}: ButtonLinkProps): ReactElement {
	const { look, native } = splitLook(props)
	return (
		<a {...native} {...lookProps(look)}>
			<ButtonFace look={look}>{children}</ButtonFace>
		</a>
	)
}
