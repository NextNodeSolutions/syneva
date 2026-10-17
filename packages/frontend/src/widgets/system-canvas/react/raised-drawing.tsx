import * as stylex from '@stylexjs/stylex'

import { projection } from './projection.styles'
import { RouteShape, TraceShape } from './route-shape'
import { SlabShape, SolidShape } from './solid-shape'

import type { MouseEvent, ReactElement } from 'react'
import type { Selection } from '../model'
import type { Paint } from '../projection/raised'
import type { View } from './solid-shape'

function PaintShape({
	paint,
	view,
	selection,
}: {
	paint: Paint
	view: View
	selection: Selection
}): ReactElement {
	if (paint.kind === 'slab')
		return <SlabShape solid={paint.solid} view={view} />
	if (paint.kind === 'part')
		return (
			<SolidShape
				part={paint.part}
				view={view}
				isSelected={selection.selected === paint.part.element.id}
				onSelect={selection.onSelect}
			/>
		)
	if (paint.kind === 'link')
		return <RouteShape raised={paint.link} view={view} />
	return <TraceShape trace={paint.trace} view={view} />
}

// The raised drawing in one SVG, painted in the order given (back to front). A click on bare ground clears the selection.
export function RaisedDrawing({
	paints,
	view,
	selection,
}: {
	paints: readonly Paint[]
	view: View
	selection: Selection
}): ReactElement {
	const clear = (event: MouseEvent<SVGSVGElement>): void => {
		if (event.target === event.currentTarget) selection.onSelect(null)
	}
	return (
		<svg
			aria-hidden="true"
			onClick={clear}
			{...stylex.props(projection.drawing)}
		>
			{paints.map(paint => (
				<PaintShape
					key={`${paint.kind}:${paint.key}`}
					paint={paint}
					view={view}
					selection={selection}
				/>
			))}
		</svg>
	)
}
