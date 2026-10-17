import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { OrbitControls } from './orbit-controls'
import { projection } from './projection.styles'
import { RaisedDrawing } from './raised-drawing'
import { RaisedNames } from './raised-names'
import { useOrbitScene } from './use-raised-scene'

import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Selection } from '../model'

// The scene in perspective for the reviewer to turn: a drag turns and tilts it, the corner's buttons do the same for a keyboard.
export function OrbitField({
	scene,
	selected,
	onSelect,
}: Selection & { scene: Scene }): ReactElement {
	const fieldRef = useRef<HTMLDivElement | null>(null)
	const orbit = useOrbitScene(scene, fieldRef)
	const { hold } = orbit
	const selection = { selected, onSelect }
	return (
		<div
			ref={fieldRef}
			onPointerDown={hold.onPointerDown}
			onPointerMove={hold.onPointerMove}
			onPointerUp={hold.onPointerUp}
			onPointerCancel={hold.onPointerUp}
			{...stylex.props(
				canvas.field,
				canvas.fieldHeight(orbit.height),
				projection.field,
				projection.orbit,
			)}
		>
			<RaisedDrawing
				paints={orbit.paints}
				view={orbit.view}
				selection={selection}
			/>
			<RaisedNames
				raised={orbit.raised}
				view={orbit.view}
				selection={selection}
			/>
			<OrbitControls hold={hold} />
		</div>
	)
}
