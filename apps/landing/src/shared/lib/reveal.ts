import { poses } from '@syneva/motion/poses'

import { sx } from './sx'

import type { Attributes, Part } from './sx'

// Reveal attributes (see @syneva/motion/reveal). A group arrives once; its
// items rise in, staggered; a ruled group also draws its top rule; a scene
// pauses its animations while offscreen. The element's own styles come after
// the pose, so a style that restates a posed property keeps the last word.
type RevealGroup = Attributes & { 'data-reveal': '' }
type RuledRevealGroup = RevealGroup & { 'data-rule': '' }
type RevealItem = Attributes & { 'data-reveal-item': '' }

export const revealGroup = (...styles: Part[]): RevealGroup => ({
	...sx(...styles),
	'data-reveal': '',
})

export const revealRuledGroup = (...styles: Part[]): RuledRevealGroup => ({
	...sx(poses.rule, ...styles),
	'data-reveal': '',
	'data-rule': '',
})

export const revealItem = (...styles: Part[]): RevealItem => ({
	...sx(poses.revealItem, ...styles),
	'data-reveal-item': '',
})

export const scene = { 'data-motion-scene': '' } as const
