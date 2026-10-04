import { inView } from 'motion'

import { animate } from './animate'
import { countUp } from './count-up'
import { EASE, toBezier } from './easing'
import { playVocabulary } from './placement'
import { prefersStatic } from './preference'
import { syncScenes } from './scenes'

import type { AnimateOptions } from './options'

// Reveal groups arrive once: a [data-reveal] section's [data-reveal-item]
// children rise in with a stagger, a [data-rule] section draws an accent rule
// that settles into its border, its facts count up and its drawings play.
const REVEAL = { amount: 0.12, margin: '0px 0px -8% 0px' } as const
const ITEM = { duration: 0.7, stagger: 0.07, rise: 'translateY(18px)' } as const
const STAGGER_CAP = 9
const RULE = { duration: 1.4, delay: 0.05, drawn: 0.7, opacity: 0.9 } as const

const out = toBezier(EASE.out)
const RULE_TIMING: AnimateOptions = {
	duration: RULE.duration,
	delay: RULE.delay,
	times: [0, RULE.drawn, 1],
	ease: [out, out, out],
	pseudoElement: '::before',
}

const itemsOf = (group: Element): Element[] => [
	...group.querySelectorAll('[data-reveal-item]'),
]

function revealGroup(group: Element): void {
	if (prefersStatic()) return
	animate(
		itemsOf(group),
		{ opacity: [0, 1], transform: [ITEM.rise, 'none'] },
		{
			duration: ITEM.duration,
			ease: out,
			delay: index => Math.min(index, STAGGER_CAP) * ITEM.stagger,
		},
	)
	if (group instanceof HTMLElement && 'rule' in group.dataset)
		animate(
			group,
			{
				transform: ['scaleX(0)', 'scaleX(1)', 'scaleX(1)'],
				opacity: [RULE.opacity, RULE.opacity, 0],
			},
			RULE_TIMING,
		)
	for (const fact of group.querySelectorAll('[data-count]'))
		if (fact instanceof HTMLElement) countUp(fact)
	playVocabulary(group)
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
	stopRevealing = inView('[data-reveal]', revealGroup, REVEAL)
}
