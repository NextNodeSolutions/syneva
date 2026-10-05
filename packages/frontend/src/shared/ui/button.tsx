import { ButtonFace } from './button-face'
import { lookProps, splitLook } from './button-look'

import type { ComponentPropsWithRef, ReactElement } from 'react'
import type { ButtonLook } from './button-look'

type ButtonProps = ButtonLook &
	Omit<ComponentPropsWithRef<'button'>, 'className' | 'style'>

// A button in the apps' control recipe. It defaults to type="button", so
// only a form's declared submit submits it. While busy it is disabled and
// says so (aria-busy), its label swapped for busyLabel and its arrow gone.
export function Button({
	children,
	type = 'button',
	...props
}: ButtonProps): ReactElement {
	const { look, native } = splitLook(props)
	const isBusy = look.busy === true
	return (
		<button
			type={type}
			{...native}
			{...lookProps(look)}
			disabled={isBusy || native.disabled}
			aria-busy={isBusy || undefined}
		>
			<ButtonFace look={look}>{children}</ButtonFace>
		</button>
	)
}
