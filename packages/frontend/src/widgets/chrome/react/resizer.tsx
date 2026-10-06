import { useState } from 'react'

import * as stylex from '@stylexjs/stylex'

import { resizer } from './resizer.styles'

import type { PointerEvent, ReactElement } from 'react'

const LEFT_WIDTH_DEFAULT_PX = 280
const LEFT_WIDTH_RANGE = { min: 180, max: 520 }

function clamp(width: number): number {
	return Math.max(LEFT_WIDTH_RANGE.min, Math.min(LEFT_WIDTH_RANGE.max, width))
}

function currentWidth(): number {
	const width = getComputedStyle(document.documentElement).getPropertyValue(
		'--left-width',
	)
	return parseInt(width) || LEFT_WIDTH_DEFAULT_PX
}

export function Resizer({ hidden }: { hidden: boolean }): ReactElement {
	const [dragging, setDragging] = useState(false)
	const start = (event: PointerEvent<HTMLDivElement>): void => {
		event.preventDefault()
		const handle = event.currentTarget
		const startX = event.clientX
		const startWidth = currentWidth()
		handle.setPointerCapture(event.pointerId)
		setDragging(true)
		const onMove = (move: globalThis.PointerEvent): void => {
			document.documentElement.style.setProperty(
				'--left-width',
				`${clamp(startWidth + move.clientX - startX)}px`,
			)
		}
		const onUp = (): void => {
			setDragging(false)
			handle.removeEventListener('pointermove', onMove)
			handle.removeEventListener('pointerup', onUp)
		}
		handle.addEventListener('pointermove', onMove)
		handle.addEventListener('pointerup', onUp)
	}
	return (
		<div
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize file tree"
			{...stylex.props(
				resizer.rule,
				dragging && resizer.dragging,
				hidden && resizer.hidden,
			)}
			onPointerDown={start}
		/>
	)
}
