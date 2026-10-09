import { key, navigable, shift } from '@app/hotkey-matchers'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'

import { S } from './store'

import type { Hotkey } from '@app/hotkey-matchers'

const guided = (): boolean => hasGuide(guideInputs(S)) && navigable()

// The guided review's keys: domains in risk order, a domain's changes, back after a reference, the explanation's toggle.
// The bracket pair stays the hub shell's (`[` folds the rail on every page), so the domains take `d` and the domain's changes the `,` `.` pair.
export const HOTKEYS_GUIDE: Hotkey[] = [
	{
		combo: 'd',
		desc: 'Next domain (risk order)',
		group: 'Navigate',
		test: key('d'),
		when: guided,
		run: () => S.stepDomain?.(1),
	},
	{
		combo: '⇧D',
		desc: 'Previous domain',
		group: 'Navigate',
		test: shift('D'),
		when: guided,
		run: () => S.stepDomain?.(-1),
	},
	{
		combo: '.',
		desc: 'Next change of the domain',
		group: 'Navigate',
		test: key('.'),
		when: guided,
		run: () => S.stepDomainChange?.(1),
	},
	{
		combo: ',',
		desc: 'Previous change of the domain',
		group: 'Navigate',
		test: key(','),
		when: guided,
		run: () => S.stepDomainChange?.(-1),
	},
	{
		combo: 'b',
		desc: 'Back to where you were before following a reference',
		group: 'Navigate',
		test: key('b'),
		when: guided,
		run: () => S.guideBack?.(),
	},
	{
		combo: 'g',
		desc: 'Show / hide the explanation',
		group: 'View',
		test: key('g'),
		when: guided,
		run: () => S.toggleGuidePane?.(),
	},
]
