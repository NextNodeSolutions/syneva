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

// On arrival a [data-reveal] section raises its [data-reveal-item] children (staggered), draws its [data-rule], counts its facts up and plays its drawings.
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
	// Completing at once means a later switch to no-preference never arms a hidden pose over content already seen; the rule, counts and loops stay still.
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
	syncScenes(group)
}

// A group reveals once, on arrival in view OR focus landing inside it: tabbing scrolls a control only to the viewport's edge, short of the arrival line, and a focused control must never stay hidden.
const GROUP = `[${ATTRIBUTE.revealGroup}]`
const revealed = new WeakSet<Element>()
function revealOnce(group: Element): void {
	if (revealed.has(group)) return
	revealed.add(group)
	playReveal(group)
}

function revealAround(focused: EventTarget | null): void {
	if (!(focused instanceof Element)) return
	for (
		let group = focused.closest(GROUP);
		group;
		group = group.parentElement?.closest(GROUP) ?? null
	)
		revealOnce(group)
}

// Arm once the hidden poses are in effect, or an entrance lands on a pose that was never seen; the page's runtime calls this once, at boot.
export function armReveals(): void {
	inView(GROUP, revealOnce, REVEAL)
	document.addEventListener('focusin', ({ target }) => revealAround(target))
}
