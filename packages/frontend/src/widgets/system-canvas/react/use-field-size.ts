import { useLayoutEffect, useState } from 'react'

import { fitScale, REFERENCE } from '../layout/canvas-layout'

import type { RefObject } from 'react'
import type { CanvasLayout } from '../layout/canvas-layout'

const MIN_HEIGHT = 320
const PADDING = 24

export type FieldSize = { width: number; height: number }

// The field is as tall as the drawing needs at the scale its width allows (never above full size), between a floor that keeps a small system from looking lost and the tallest the overview gives it; a narrower window lowers it with the drawing. Every projection of a scene shares that height, so switching between them never moves the page.
export function useFieldSize(
	field: RefObject<HTMLDivElement | null>,
	layout: CanvasLayout,
): FieldSize {
	const [width, setWidth] = useState(REFERENCE.width)
	useLayoutEffect(() => {
		const element = field.current
		if (!element) return undefined
		// An observer reports the size it starts on before the next paint, so the first width comes from it too.
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setWidth(entry.contentRect.width)
		})
		observer.observe(element)
		return () => observer.disconnect()
	}, [field])
	const scale = fitScale(layout, {
		width: Math.max(1, width - PADDING),
		height: REFERENCE.height,
	})
	return {
		width,
		height: Math.min(
			REFERENCE.height,
			Math.max(MIN_HEIGHT, Math.ceil(layout.height * scale) + PADDING),
		),
	}
}
