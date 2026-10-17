import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { ProjectedNames } from './projected-names'
import { projection } from './projection.styles'
import { RouteShape } from './route-shape'
import { SolidShape } from './solid-shape'
import { useProjectedScene } from './use-projected-scene'

import type { MouseEvent, ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Selection } from '../model'
import type { Solid } from '../projection/solids'
import type { ProjectedScene } from './use-projected-scene'

// The drawing, painted back to front: the platforms, the links over them, then the blocks. A click on bare ground clears the selection.
function Drawing({
	scene,
	raised,
	selected,
	onSelect,
}: Selection & { scene: Scene; raised: ProjectedScene }): ReactElement {
	const { camera, floor } = raised
	const links = new Map(scene.links.map(link => [link.id, link]))
	const shape = (solid: Solid): ReactElement | null => {
		const element = scene.elements.get(solid.id)
		if (!element) return null
		return (
			<SolidShape
				key={solid.id}
				solid={solid}
				element={element}
				view={raised}
				isSelected={selected === solid.id}
				onSelect={onSelect}
			/>
		)
	}
	const clear = (event: MouseEvent<SVGSVGElement>): void => {
		if (event.target === event.currentTarget) onSelect(null)
	}
	return (
		<svg
			aria-hidden="true"
			onClick={clear}
			{...stylex.props(projection.drawing)}
		>
			{raised.order.platforms.map(shape)}
			{raised.routes.map(route => {
				const link = links.get(route.id)
				if (!link) return null
				return (
					<RouteShape
						key={route.id}
						route={route}
						link={link}
						camera={camera}
						floor={floor}
					/>
				)
			})}
			{raised.order.blocks.map(shape)}
		</svg>
	)
}

// The scene raised: the same ELK layout as the plan, its containers as platforms and its parts as blocks, seen by an isometric camera that fits the field.
export function ProjectedField({
	scene,
	selected,
	onSelect,
}: Selection & { scene: Scene }): ReactElement {
	const fieldRef = useRef<HTMLDivElement | null>(null)
	const raised = useProjectedScene(scene, fieldRef)
	return (
		<div
			ref={fieldRef}
			{...stylex.props(
				canvas.field,
				canvas.fieldHeight(raised.height),
				projection.field,
			)}
		>
			<Drawing
				scene={scene}
				raised={raised}
				selected={selected}
				onSelect={onSelect}
			/>
			<ProjectedNames
				raised={raised}
				scene={scene}
				selection={{ selected, onSelect }}
			/>
		</div>
	)
}
