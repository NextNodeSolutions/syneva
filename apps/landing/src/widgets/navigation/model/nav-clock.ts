import { toBezier } from '@syneva/motion/easing'

import { dockClock, navClock } from '../ui/nav.stylex'

import type { Bezier } from '@syneva/motion/easing'

type NavClock = {
	duration: Record<'menu' | 'preview' | 'close' | 'bar' | 'fold', number>
	ease: Bezier
	unfoldEase: Bezier
	travel: Record<'panel' | 'preview', number>
}

const MS_PER_S = 1000

function toSeconds(time: string): number {
	const amount = Number.parseFloat(time)
	return time.endsWith('ms') ? amount / MS_PER_S : amount
}

export const NAV_CLOCK: NavClock = {
	duration: {
		menu: toSeconds(navClock.menuDuration),
		preview: toSeconds(navClock.previewDuration),
		close: toSeconds(navClock.closeDuration),
		bar: toSeconds(navClock.barDuration),
		fold: toSeconds(dockClock.foldDuration),
	},
	ease: toBezier(navClock.ease),
	unfoldEase: toBezier(dockClock.ease),
	travel: {
		panel: Number(navClock.panelTravel),
		preview: Number(navClock.previewTravel),
	},
}
