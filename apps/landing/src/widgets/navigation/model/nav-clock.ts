import { toBezier } from '@syneva/motion/easing'

import { readProperty } from './read-property'

import type { Bezier } from '@syneva/motion/easing'
import type { navClock } from '../ui/nav.stylex'

type ClockName = Extract<keyof typeof navClock, `--${string}`>

// The morph's clock as nav.stylex.ts sets it at the current width: each
// move's duration in seconds, the ease they share, and how far the panels
// and the preview scenes travel in px.
export type NavClock = {
	duration: Record<'menu' | 'preview' | 'close', number>
	ease: Bezier
	travel: Record<'panel' | 'preview', number>
}

const MS_PER_S = 1000

// The clock is written in ms but the CSS minifier may print it in seconds
// (240ms becomes .24s), so the unit decides the scale.
function toSeconds(time: string): number {
	const amount = Number.parseFloat(time)
	return time.endsWith('ms') ? amount / MS_PER_S : amount
}

export function readClock(navigation: HTMLElement): NavClock {
	const styles = getComputedStyle(navigation)
	const read = (name: ClockName): string => readProperty(styles, name)
	const pixels = (name: ClockName): number => Number.parseFloat(read(name))
	return {
		duration: {
			menu: toSeconds(read('--nav-menu-duration')),
			preview: toSeconds(read('--nav-preview-duration')),
			close: toSeconds(read('--nav-close-duration')),
		},
		ease: toBezier(read('--nav-ease')),
		travel: {
			panel: pixels('--nav-panel-travel'),
			preview: pixels('--nav-preview-travel'),
		},
	}
}
