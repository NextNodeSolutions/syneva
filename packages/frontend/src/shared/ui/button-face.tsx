import { control } from '@syneva/design-system/controls.styles'

import { ArrowRight } from './arrow-right'
import { buttonFace } from './button-face.styles'
import { Kbd } from './kbd'

import type { ReactElement, ReactNode } from 'react'
import type { ButtonLook } from './button-look'

export function ButtonFace({
	look,
	children,
}: {
	look: ButtonLook
	children: ReactNode
}): ReactElement {
	const isBusy = look.busy === true
	return (
		<>
			{isBusy && look.busyLabel ? look.busyLabel : children}
			{look.arrow === true && !isBusy && (
				<ArrowRight
					css={[
						control.arrow,
						look.size === 'small'
							? buttonFace.arrowSmall
							: buttonFace.arrowBase,
					]}
				/>
			)}
			{look.kbd && (
				<Kbd keys={look.kbd} css={buttonFace.kbd} aria-hidden="true" />
			)}
		</>
	)
}
