import { useLayoutEffect, useState } from 'react'

import { REFERENCE } from '../layout/canvas-layout'

import type { RefObject } from 'react'

export type FieldSize = { width: number; height: number }

export function useFieldSize(
	field: RefObject<HTMLDivElement | null>,
): FieldSize {
	const [width, setWidth] = useState(REFERENCE.width)
	useLayoutEffect(() => {
		const element = field.current
		if (!element) return undefined
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setWidth(entry.contentRect.width)
		})
		observer.observe(element)
		return () => observer.disconnect()
	}, [field])
	return { width, height: REFERENCE.height }
}
