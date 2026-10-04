import { ATTRIBUTE } from '@syneva/motion/attributes'
import { moveOffset, PATH_LENGTH, poses } from '@syneva/motion/poses'

import { sx } from '../../lib/sx'

import type { LoopKind, VocabularyKind } from '@syneva/motion/vocabulary'
import type { Attributes, Part } from '../../lib/sx'

// The drawing vocabulary (see @syneva/motion/vocabulary): `kind` enters once
// when its section arrives, `delay` (seconds) staggers it, and the element's
// own styles come after the hidden pose so they can restate any property the
// pose also sets. The markup position is always the finished pose. A moving
// element takes its offset too, so it has its own builder, move().
type Kind = Exclude<VocabularyKind, 'move'>

// A kind's hidden pose shares its name; pulse and blink have none.
const isPosed = (kind: Kind): kind is Kind & keyof typeof poses =>
	Object.hasOwn(poses, kind)

// A drawn or travelling path declares the length its dashes are counted in.
const isMeasured = (kind: Kind): kind is Kind & keyof typeof PATH_LENGTH =>
	Object.hasOwn(PATH_LENGTH, kind)

export type AnimAttributes = Attributes & {
	[ATTRIBUTE.anim]: VocabularyKind
	[ATTRIBUTE.delay]?: string
	pathLength?: number
}

function optIn(kind: Kind, styles: Part[]): AnimAttributes {
	return {
		...sx(isPosed(kind) && poses[kind], ...styles),
		[ATTRIBUTE.anim]: kind,
	}
}

function lengthOf(kind: Kind): Pick<AnimAttributes, 'pathLength'> | undefined {
	if (!isMeasured(kind)) return undefined
	return { pathLength: PATH_LENGTH[kind] }
}

// A delay of 0 is written too: nested elements inherit the nearest one.
export function anim(
	kind: Kind,
	delay: number,
	...styles: Part[]
): AnimAttributes {
	return {
		...optIn(kind, styles),
		[ATTRIBUTE.delay]: String(delay),
		...lengthOf(kind),
	}
}

// A loop without a delay of its own keeps time with the nearest delayed
// ancestor (a pulse inside a rising card).
export function loop(kind: LoopKind, ...styles: Part[]): AnimAttributes {
	return { ...optIn(kind, styles), ...lengthOf(kind) }
}

// Travels in from (x, y) px to its markup position.
export function move(
	delay: number,
	x: number,
	y: number,
	...styles: Part[]
): AnimAttributes {
	return {
		...sx(poses.move, ...styles),
		...moveOffset(x, y),
		[ATTRIBUTE.anim]: 'move',
		[ATTRIBUTE.delay]: String(delay),
	}
}
