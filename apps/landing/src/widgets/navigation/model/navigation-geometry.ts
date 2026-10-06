import { compact } from './compact'
import { readFrame } from './nav-frame'

import type { GeometryName } from './navigation-channels'

// Read from the layout, never written to it; the gap clears the docked sheet's edge as well as the trigger.
const PANEL_GAP = 14
const FOLD_HEIGHT = 4
const SIDES = 2

type Measures = Record<GeometryName, number>
type Box = Pick<Measures, 'x' | 'y' | 'width' | 'height'>

export type Geometry = {
	open: Box & Pick<Measures, 'indicator-x' | 'indicator-width'>
	folded: Box
	maxHeight: { dropdown: number; panel: number }
}

type MeasureInput = {
	navigation: HTMLElement
	links: HTMLElement
	toggle: HTMLElement
	trigger: HTMLElement
	panel: HTMLElement
}

export function availableWidth(navigation: HTMLElement): number {
	const { inset, border } = readFrame(navigation)
	return navigation.clientWidth - (inset + border) * SIDES
}

// On phones the sliver runs from the toggle's left edge to the open shell's right edge; the panels hold to it (panel.styles.ts) and that edge never moves.
function foldedBox(
	open: Box,
	trigger: DOMRect,
	toggle: DOMRect,
	headerLeft: number,
): Box {
	if (compact.matches) {
		const right = open.x + open.width
		const left = Math.min(Math.max(toggle.left - headerLeft, open.x), right)
		return { x: left, y: open.y, width: right - left, height: FOLD_HEIGHT }
	}
	return {
		x: trigger.left - headerLeft,
		y: open.y - PANEL_GAP - FOLD_HEIGHT,
		width: trigger.width,
		height: FOLD_HEIGHT,
	}
}

export function measureNavigation({
	navigation,
	links,
	toggle,
	trigger,
	panel,
}: MeasureInput): Geometry {
	const isCompact = compact.matches
	const { inset, border } = readFrame(navigation)
	const borders = border * SIDES
	const headerRect = navigation.getBoundingClientRect()
	const triggerRect = trigger.getBoundingClientRect()
	const panelRect = panel.getBoundingClientRect()
	const width = Math.ceil(panelRect.width) + borders
	const left = isCompact ? inset : triggerRect.left - headerRect.left
	const x = Math.max(
		inset,
		Math.min(left, navigation.clientWidth - width - inset),
	)
	// Mobile links have an entrance transform; measure their settled layout.
	const anchorBottom = isCompact
		? links.offsetTop + links.offsetHeight
		: triggerRect.bottom - headerRect.top
	const y = anchorBottom + PANEL_GAP
	const availableHeight = window.innerHeight - headerRect.top - y - inset
	const height = Math.min(
		Math.ceil(panelRect.height) + borders,
		availableHeight,
	)
	const open = { x, y, width, height }
	return {
		open: {
			...open,
			'indicator-x': trigger.offsetLeft,
			'indicator-width': trigger.offsetWidth,
		},
		folded: foldedBox(
			open,
			triggerRect,
			toggle.getBoundingClientRect(),
			headerRect.left,
		),
		maxHeight: {
			dropdown: availableHeight,
			panel: availableHeight - borders,
		},
	}
}
