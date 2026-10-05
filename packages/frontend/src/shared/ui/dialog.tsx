import { useLayoutEffect, useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { DialogBar } from './dialog-bar'
import { dialog } from './dialog.styles'

import type { ReactElement, ReactNode } from 'react'

// The ids of the dialog's title (required) and of the text that introduces it.
type DialogLabels = { labelledBy: string; describedBy?: string | undefined }

type DialogProps = DialogLabels & {
	open: boolean
	onClose: () => void
	caption: string
	children: ReactNode
}

// A native modal <dialog>: the platform traps focus, makes the page inert and
// returns focus to the opener on close. A captioned bar heads it, with an
// icon-only Cancel; compose DialogBody and DialogFooter under it (a <form>
// wrapping them needs { display: flex, flexDirection: column, minHeight: 0 }
// so the body can scroll). Every way out (Escape, Cancel, a click on the
// backdrop) asks the owner to close through onClose; `open` decides.
export function Dialog({
	open,
	onClose,
	caption,
	children,
	...labels
}: DialogProps): ReactElement {
	const ref = useRef<HTMLDialogElement>(null)
	// A backdrop click is one that both pressed and released on the dialog
	// element itself: a drag out of a field that ends on the scrim is not.
	const pressedBackdrop = useRef(false)
	useLayoutEffect(() => {
		if (!open) return undefined
		return showModal(ref.current)
	}, [open])
	return (
		<dialog
			ref={ref}
			{...stylex.props(dialog.root)}
			aria-labelledby={labels.labelledBy}
			aria-describedby={labels.describedBy}
			onCancel={event => {
				event.preventDefault()
				onClose()
			}}
			onPointerDown={event => {
				pressedBackdrop.current = event.target === event.currentTarget
			}}
			onClick={event => {
				if (
					pressedBackdrop.current &&
					event.target === event.currentTarget
				)
					onClose()
			}}
		>
			<div {...stylex.props(dialog.inner)}>
				<DialogBar caption={caption} onClose={onClose} />
				{children}
			</div>
		</dialog>
	)
}

// Show the dialog as a modal (while it is open); the returned teardown closes
// it. It runs in a layout effect, for two reasons. Its teardown runs before
// React removes the element: a modal removed while open never runs its close
// steps, so focus would not return to the opener. And React applies autoFocus
// while the dialog is still closed, where nothing can take focus: the content
// marks its first focus with data-autofocus instead, taken once the modal is
// shown (without one, the platform focuses the first focusable control).
function showModal(
	element: HTMLDialogElement | null,
): (() => void) | undefined {
	if (!element) return undefined
	element.showModal()
	element.querySelector<HTMLElement>('[data-autofocus]')?.focus()
	return () => element.close()
}
