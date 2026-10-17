import * as stylex from '@stylexjs/stylex'

import { faceFrame } from '../projection/face-frame'

import { useCanvasActions } from './canvas-actions'
import { useCanvasFocus } from './canvas-focus'
import { domainTitle } from './domain-numbers'
import { faceNumber } from './face-number.styles'

import type { MouseEvent, ReactElement } from 'react'
import type { Camera, Size } from '../projection/camera'
import type { RaisedPart } from '../projection/raised'

// In the face's own units: the square a number is painted in, the space between two, and the inset from the face's edge.
const SQUARE = 22
const STEP = 27
const INSET = 10
const BASELINE = 16
const HALF = 0.5

// The numbers of the domains that change a part, painted on its front like plates on a building (on its top when it stands too low): the way down to the review, in the tiers. Pointing at one lights its domain, choosing it opens the domain; the keyboard reaches the same domains through the inspector.
export function FaceNumbers({
	part,
	view,
}: {
	part: RaisedPart
	view: { camera: Camera; floor: Size }
}): ReactElement | null {
	const focus = useCanvasFocus()
	const actions = useCanvasActions()
	const domains = focus.domainsOf(part.element)
	if (!domains.length) return null
	const frame = faceFrame(part.solid, view)
	const top = Math.max(0, (frame.height - SQUARE) * HALF)
	const open = (event: MouseEvent, id: string): void => {
		event.stopPropagation()
		actions.onOpen(id)
	}
	return (
		<g transform={frame.matrix}>
			{domains.map((domain, index) => (
				<g
					key={domain.id}
					onClick={event => open(event, domain.id)}
					onMouseEnter={() => actions.onFocus(domain.id)}
					onMouseLeave={() => actions.onFocus(null)}
					{...stylex.props(faceNumber.plate)}
				>
					<title>{domainTitle(domain)}</title>
					<rect
						x={INSET + index * STEP}
						y={top}
						width={SQUARE}
						height={SQUARE}
						{...stylex.props(faceNumber.square)}
					/>
					<text
						x={INSET + index * STEP + SQUARE * HALF}
						y={top + BASELINE}
						{...stylex.props(faceNumber.text)}
					>
						{domain.number}
					</text>
				</g>
			))}
		</g>
	)
}
