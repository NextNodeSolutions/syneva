import { ButtonFace } from './button-face'
import { lookProps, splitLook } from './button-look'

import type { ComponentPropsWithRef, ReactElement } from 'react'
import type { ButtonLook } from './button-look'

type ButtonLinkProps = Omit<ButtonLook, 'busy' | 'busyLabel'> &
	Omit<ComponentPropsWithRef<'a'>, 'className' | 'style' | 'href'> & {
		href: string
	}

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
