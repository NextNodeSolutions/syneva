import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { projection } from './projection.styles'
import { RaisedDrawing } from './raised-drawing'
import { RaisedNames } from './raised-names'
import { useTierScene } from './use-raised-scene'

import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Selection } from '../model'

// The tiers: the scene's parts on the floors of their tiers, the interface over the services over the data, the people and the other systems on the rim; a change raises its part and wears its domains on its front, the links drop between the floors in front of them. One glance says where in the architecture the change sits.
export function TierField({
	scene,
	selected,
	onSelect,
}: Selection & { scene: Scene }): ReactElement {
	const fieldRef = useRef<HTMLDivElement | null>(null)
	const tiers = useTierScene(scene, fieldRef)
	const selection = { selected, onSelect }
	return (
		<div
			ref={fieldRef}
			{...stylex.props(
				canvas.field,
				canvas.fieldHeight(tiers.height),
				projection.field,
			)}
		>
			<RaisedDrawing
				paints={tiers.paints}
				view={tiers.view}
				selection={selection}
			/>
			<RaisedNames
				raised={tiers.raised}
				view={tiers.view}
				selection={selection}
			/>
		</div>
	)
}
