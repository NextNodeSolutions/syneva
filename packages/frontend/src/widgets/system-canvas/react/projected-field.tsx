import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { OrbitControls } from './orbit-controls'
import { ProjectedNames } from './projected-names'
import { projection } from './projection.styles'
import { RouteShape } from './route-shape'
import { SolidShape } from './solid-shape'
import { useProjectedScene } from './use-projected-scene'

import type { MouseEvent, ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Projection, Selection } from '../model'
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

// The scene raised: the same ELK layout as the plan, its containers as platforms and its parts as blocks, seen by an isometric camera that fits the field, or in perspective for the reviewer to turn.
export function ProjectedField({
	scene,
	mode,
	selected,
	onSelect,
}: Selection & {
	scene: Scene
	mode: Exclude<Projection, 'plan'>
}): ReactElement {
	const fieldRef = useRef<HTMLDivElement | null>(null)
	const isOrbit = mode === 'orbit'
	const raised = useProjectedScene(scene, mode, fieldRef)
	const { hold } = raised
	return (
		<div
			ref={fieldRef}
			{...(isOrbit && {
				onPointerDown: hold.onPointerDown,
				onPointerMove: hold.onPointerMove,
				onPointerUp: hold.onPointerUp,
				onPointerCancel: hold.onPointerUp,
			})}
			{...stylex.props(
				canvas.field,
				canvas.fieldHeight(raised.height),
				projection.field,
				isOrbit && projection.orbit,
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
			{isOrbit && <OrbitControls hold={hold} />}
		</div>
	)
}
