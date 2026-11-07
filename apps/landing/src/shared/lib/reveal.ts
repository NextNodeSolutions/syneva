import { ATTRIBUTE } from '@syneva/motion/attributes'
import { poses } from '@syneva/motion/poses'

import { sx } from './sx'

import type { Attributes, Part } from './sx'

// A group arrives once; its items rise in staggered and its facts count up; a ruled group also draws its top rule; a scene pauses offscreen. Element styles come after the pose, so one that restates a posed property wins.
type RevealGroup = Attributes & { [ATTRIBUTE.revealGroup]: '' }
type RuledRevealGroup = RevealGroup & { [ATTRIBUTE.rule]: '' }
type RevealItem = Attributes & { [ATTRIBUTE.revealItem]: '' }
type RevealCount = { [ATTRIBUTE.count]: string }

export const revealGroup = (...styles: Part[]): RevealGroup => ({
	...sx(...styles),
	[ATTRIBUTE.revealGroup]: '',
})

export const revealRuledGroup = (...styles: Part[]): RuledRevealGroup => ({
	...sx(poses.rule, ...styles),
	[ATTRIBUTE.revealGroup]: '',
	[ATTRIBUTE.rule]: '',
})

export const revealItem = (...styles: Part[]): RevealItem => ({
	...sx(poses.revealItem, ...styles),
	[ATTRIBUTE.revealItem]: '',
})

export const revealCount = (count: number): RevealCount => ({
	[ATTRIBUTE.count]: String(count),
})

export const scene = { [ATTRIBUTE.scene]: '' } as const
