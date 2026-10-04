import { poses } from '@syneva/motion/poses'

import { sx } from '../../lib/sx'

import type { VocabularyKind } from '@syneva/motion/vocabulary'
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

export type AnimAttributes = Attributes & {
	'data-anim': VocabularyKind
	'data-delay'?: string
}

// A delay of 0 is written too: nested elements inherit the nearest one.
function delayAttribute(
	delay: number | undefined,
): { 'data-delay': string } | undefined {
	if (typeof delay !== 'number') return undefined
	return { 'data-delay': String(delay) }
}

export function anim(
	kind: Kind,
	delay?: number,
	...styles: Part[]
): AnimAttributes {
	return {
		...sx(isPosed(kind) && poses[kind], ...styles),
		'data-anim': kind,
		...delayAttribute(delay),
	}
}

// .a-move: travels in from (x, y) px to its markup position.
export function move(
	delay: number,
	x: number,
	y: number,
	...styles: Part[]
): AnimAttributes {
	return {
		...sx(poses.move, ...styles),
		style: `--tx:${x}px;--ty:${y}px`,
		'data-anim': 'move',
		'data-delay': String(delay),
	}
}
