import { poses } from '@syneva/motion/poses'

import { sx } from './sx'

import type { Attributes, Part } from './sx'

// Reveal attributes (see @syneva/motion/reveal). A group arrives once; its
// items rise in, staggered; a ruled group draws its top rule; a scene pauses
// its animations while offscreen. The element's own styles come after the
// pose, so a style that restates a posed property keeps the last word.
type RevealGroup = Attributes & { 'data-reveal': ''; 'data-rule'?: '' }
type RevealItem = Attributes & { 'data-reveal-item': '' }

const ruleAttribute = (isRuled: boolean): { 'data-rule': '' } | undefined =>
	isRuled ? { 'data-rule': '' } : undefined

export const revealGroup = (
	isRuled: boolean,
	...styles: Part[]
): RevealGroup => ({
	...sx(isRuled && poses.rule, ...styles),
	'data-reveal': '',
	...ruleAttribute(isRuled),
})

export const revealItem = (...styles: Part[]): RevealItem => ({
	...sx(poses.revealItem, ...styles),
	'data-reveal-item': '',
})

export const scene = { 'data-motion-scene': '' } as const
