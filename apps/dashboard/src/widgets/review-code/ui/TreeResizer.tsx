import { useState } from 'react'

import * as stylex from '@stylexjs/stylex'

import { clampTreeWidth, TREE_WIDTH } from '../model/tree-width'

import { treeResizer } from './tree-resizer.styles'

import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'

type TreeResizerProps = {
	width: number
	onResize: (width: number) => void
}

type Drag = { startX: number; startWidth: number }

const RESIZE_STEPS: Readonly<Record<string, number>> = {
	ArrowLeft: -TREE_WIDTH.step,
	ArrowRight: TREE_WIDTH.step,
}

export function TreeResizer({
	width,
	onResize,
}: TreeResizerProps): ReactElement {
	const [drag, setDrag] = useState<Drag | null>(null)
	const startDrag = (event: PointerEvent<HTMLDivElement>): void => {
		event.currentTarget.setPointerCapture(event.pointerId)
		setDrag({ startX: event.clientX, startWidth: width })
	}
	const followDrag = (event: PointerEvent<HTMLDivElement>): void => {
		if (!drag) return
		onResize(clampTreeWidth(drag.startWidth + event.clientX - drag.startX))
	}
	const endDrag = (): void => setDrag(null)
	const nudge = (event: KeyboardEvent<HTMLDivElement>): void => {
		const step = RESIZE_STEPS[event.key]
		if (step === undefined || event.shiftKey) return
		event.preventDefault()
		onResize(clampTreeWidth(width + step))
	}
	return (
		<div
			role="separator"
			tabIndex={0}
			aria-orientation="vertical"
			aria-label="Resize the file tree"
			aria-valuenow={width}
			aria-valuemin={TREE_WIDTH.min}
			aria-valuemax={TREE_WIDTH.max}
			onPointerDown={startDrag}
			onPointerMove={followDrag}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onKeyDown={nudge}
			{...stylex.props(
				treeResizer.handle,
				drag !== null && treeResizer.dragging,
			)}
		/>
	)
}
