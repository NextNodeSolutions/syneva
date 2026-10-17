import { changeStroke } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { facesOf, polygon } from '../projection/faces'

import { useCanvasFocus } from './canvas-focus'
import { solid as styles } from './solid.styles'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { MouseEvent, ReactElement } from 'react'
import type { Camera, Size } from '../projection/camera'
import type { Face } from '../projection/faces'
import type { Solid } from '../projection/solids'
import type { Tone } from './canvas-focus'

const FILL = { top: styles.top, side: styles.side, end: styles.end }
const LIT = { top: styles.litTop, side: styles.litSide, end: styles.litEnd }

type Paint = { tone: Tone; isSelected: boolean }

function BlockFace({
	face,
	element,
	paint,
}: {
	face: Face
	element: ModelElement
	paint: Paint
}): ReactElement {
	const isLit = paint.tone === 'lit' || paint.isSelected
	return (
		<polygon
			points={polygon(face.points)}
			{...stylex.props(
				styles.face,
				FILL[face.kind],
				element.change && changeStroke[element.change],
				isLit && LIT[face.kind],
				paint.isSelected && face.kind === 'top' && styles.selectedTop,
			)}
		/>
	)
}

function PlatformFace({
	face,
	paint,
}: {
	face: Face
	paint: Paint
}): ReactElement {
	const isTop = face.kind === 'top'
	return (
		<polygon
			points={polygon(face.points)}
			{...stylex.props(
				styles.face,
				isTop ? styles.platformTop : FILL[face.kind],
				(paint.tone === 'lit' || paint.isSelected) &&
					styles.platformLit,
				paint.isSelected && isTop && styles.selectedTop,
			)}
		/>
	)
}

// One part raised: the faces the camera sees, in the part's tone. Selecting it is a click anywhere on it.
export function SolidShape({
	solid,
	element,
	view,
	isSelected,
	onSelect,
}: {
	solid: Solid
	element: ModelElement
	view: { camera: Camera; floor: Size }
	isSelected: boolean
	onSelect: (id: string) => void
}): ReactElement {
	const focus = useCanvasFocus()
	const paint = { tone: focus.toneOf(solid.id), isSelected }
	const select = (event: MouseEvent): void => {
		event.stopPropagation()
		onSelect(solid.id)
	}
	return (
		<g
			{...stylex.props(paint.tone === 'dim' && styles.dim)}
			onClick={select}
		>
			{facesOf(solid, view.camera, view.floor).map(face =>
				solid.isPlatform ? (
					<PlatformFace key={face.kind} face={face} paint={paint} />
				) : (
					<BlockFace
						key={face.kind}
						face={face}
						element={element}
						paint={paint}
					/>
				),
			)}
		</g>
	)
}
