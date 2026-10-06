import { readProperty } from './read-property'

import type { navFrame } from '../ui/nav.stylex'

type FrameName = Extract<keyof typeof navFrame, `--${string}`>

export type DropdownFrame = Record<'inset' | 'border', number>

export function readFrame(navigation: HTMLElement): DropdownFrame {
	const styles = getComputedStyle(navigation)
	const pixels = (name: FrameName): number =>
		Number.parseFloat(readProperty(styles, name))
	return {
		inset: pixels('--nav-dropdown-inset'),
		border: pixels('--nav-dropdown-border'),
	}
}
