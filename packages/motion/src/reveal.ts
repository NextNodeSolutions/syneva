import { ATTRIBUTE } from './attributes'
import { countUp } from './count-up'
import { EASE } from './easing'
import { animate, inView } from './engine'
import { playVocabulary } from './play-vocabulary'
import { POSE_VALUES } from './poses'
import { reducedMotion } from './preference'
import { syncScenes } from './scenes'
import { ENTRANCES, LOOPS } from './vocabulary'

import type { AnimateOptions } from './engine'

// Reveal groups arrive once: a [data-reveal] section's [data-reveal-item]
// children rise in with a stagger, a [data-rule] section draws an accent rule
// that settles into its border, its facts count up and its drawings play.
const REVEAL = { amount: 0.12, margin: '0px 0px -8% 0px' } as const
const ITEM = { duration: 0.7, stagger: 0.07 } as const
const STAGGER_CAP = 9
const RULE = { duration: 1.4, delay: 0.05, drawn: 0.7 } as const

const { out } = EASE
const RULE_TIMING: AnimateOptions = {
	duration: RULE.duration,
	delay: RULE.delay,
	times: [0, RULE.drawn, 1],
	ease: [out, out, out],
	pseudoElement: '::before',
}

const itemsOf = (group: Element): Element[] => [
	...group.querySelectorAll(`[${ATTRIBUTE.revealItem}]`),
]

// The group's items and drawings leave their hidden poses.
const enter = (group: Element): ReturnType<typeof animate>[] => [
	animate(
		itemsOf(group),
		{ opacity: [0, 1], transform: [POSE_VALUES.itemRise, 'none'] },
		{
			duration: ITEM.duration,
			ease: out,
			delay: index => Math.min(index, STAGGER_CAP) * ITEM.stagger,
		},
	),
	...playVocabulary(group, ENTRANCES),
]

function playReveal(group: Element): void {
	const entrances = enter(group)
	// Reduced motion lands the entrances on their finished pose at once, so a
	// later switch to no-preference never arms a hidden pose over content
	// already seen. The rule, the counts and the loops stay still.
	if (reducedMotion.matches) {
		entrances.forEach(entrance => entrance.complete())
		return
	}
	if (group.hasAttribute(ATTRIBUTE.rule))
		animate(
			group,
			{
				transform: ['scaleX(0)', 'scaleX(1)', 'scaleX(1)'],
				opacity: [POSE_VALUES.ruleOpacity, POSE_VALUES.ruleOpacity, 0],
			},
			RULE_TIMING,
		)
	for (const fact of group.querySelectorAll(`[${ATTRIBUTE.count}]`))
		if (fact instanceof HTMLElement) countUp(fact)
	playVocabulary(group, LOOPS)
	// The group's scenes (its figures) hold their new animations until they
	// are in view themselves.
	syncScenes(group)
}

// Kept in module scope: the observer must outlive the call that created it.
let stopRevealing: (() => void) | undefined

// Arms every group once the hidden poses are in effect, so the entrance plays
// instead of landing on a pose that was never seen.
export function armReveals(): void {
	stopRevealing?.()
	stopRevealing = inView(`[${ATTRIBUTE.revealGroup}]`, playReveal, REVEAL)
}
