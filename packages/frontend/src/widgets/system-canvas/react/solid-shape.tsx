import * as stylex from '@stylexjs/stylex'

import { facesOf, polygon } from '../projection/faces'

import { useCanvasActions } from './canvas-actions'
import { useCanvasFocus } from './canvas-focus'
import { FaceNumbers } from './face-numbers'
import { markFace, solid as styles } from './solid.styles'

import type { ChangeMark } from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { MouseEvent, ReactElement } from 'react'
import type { Camera, Size } from '../projection/camera'
import type { Face, FaceKind } from '../projection/faces'
import type { RaisedPart } from '../projection/raised'
import type { Solid } from '../projection/solids'
import type { Tone } from './canvas-focus'

export type View = { camera: Camera; floor: Size }

const FILL = { top: styles.top, side: styles.side, end: styles.end }
const MARK: Record<ChangeMark, Record<FaceKind, StaticStyle>> = {
	added: {
		top: markFace.addedTop,
		side: markFace.addedSide,
		end: markFace.addedEnd,
	},
	changed: {
		top: markFace.changedTop,
		side: markFace.changedSide,
		end: markFace.changedEnd,
	},
	removed: {
		top: markFace.removedTop,
		side: markFace.removedSide,
		end: markFace.removedEnd,
	},
}

type Paint = { tone: Tone; isSelected: boolean }

function PartFace({
	face,
	part,
	paint,
}: {
	face: Face
	part: RaisedPart
	paint: Paint
}): ReactElement {
	const isTop = face.kind === 'top'
	const { isPlatform } = part.solid
	return (
		<polygon
			points={polygon(face.points)}
			{...stylex.props(
				styles.face,
				isPlatform && isTop ? styles.platformTop : FILL[face.kind],
				!isPlatform && part.mark && MARK[part.mark][face.kind],
				paint.tone === 'lit' && styles.lit,
				paint.isSelected && isTop && styles.selectedTop,
			)}
		/>
	)
}

// One part raised: the faces the camera sees, in the change it shows and the reviewer's focus; on a numbered part, its domains' numbers on a face. Pointing at it traces its links, a click selects it.
export function SolidShape({
	part,
	view,
	isSelected,
	onSelect,
}: {
	part: RaisedPart
	view: View
	isSelected: boolean
	onSelect: (id: string) => void
}): ReactElement {
	const focus = useCanvasFocus()
	const actions = useCanvasActions()
	const { id } = part.element
	const paint = { tone: focus.toneOf(id), isSelected }
	const select = (event: MouseEvent): void => {
		event.stopPropagation()
		onSelect(id)
	}
	return (
		<g
			{...stylex.props(
				part.isQuiet && styles.quiet,
				paint.tone === 'dim' && styles.dim,
			)}
			onClick={select}
			onMouseEnter={() => actions.onHover(id)}
			onMouseLeave={() => actions.onHover(null)}
		>
			{facesOf(part.solid, view.camera, view.floor).map(face => (
				<PartFace
					key={face.kind}
					face={face}
					part={part}
					paint={paint}
				/>
			))}
			{part.isNumbered && <FaceNumbers part={part} view={view} />}
		</g>
	)
}

// A deck's slab or a rim part's ledge: the ground, never a part, so the pointer goes through it.
export function SlabShape({
	solid,
	view,
}: {
	solid: Solid
	view: View
}): ReactElement {
	return (
		<g>
			{facesOf(solid, view.camera, view.floor).map(face => (
				<polygon
					key={face.kind}
					points={polygon(face.points)}
					{...stylex.props(
						styles.slab,
						face.kind === 'top' && styles.slabTop,
					)}
				/>
			))}
		</g>
	)
}
