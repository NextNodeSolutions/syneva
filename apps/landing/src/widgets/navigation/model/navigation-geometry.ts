import { compact } from './compact'
import { readFrame } from './nav-frame'

import type { GeometryName } from './navigation-channels'

// The dropdown's geometry, read from the layout and never written to it:
// the width a panel may take, where the open panel lands independently of
// the shell's current animated size, the folded sliver under its trigger it
// grows from and shrinks back into, and the heights the viewport leaves.
// The gap clears the docked sheet's edge as well as the trigger.
const PANEL_GAP = 14
const FOLD_HEIGHT = 4
// The inset and the border apply on both sides.
const SIDES = 2

// Pixel values of the shell's geometry channels.
type Measures = Record<GeometryName, number>
type Box = Pick<Measures, 'x' | 'y' | 'width' | 'height'>

export type Geometry = {
	open: Box & Pick<Measures, 'indicator-x' | 'indicator-width'>
	folded: Box
	// The dropdown and its panel never run past the bottom of the viewport.
	maxHeight: { dropdown: number; panel: number }
}

type MeasureInput = {
	navigation: HTMLElement
	links: HTMLElement
	trigger: HTMLElement
	panel: HTMLElement
}

// The width a panel may take inside the dropdown's inset and border.
export function availableWidth(navigation: HTMLElement): number {
	const { inset, border } = readFrame(navigation)
	return navigation.clientWidth - (inset + border) * SIDES
}

export function measureNavigation({
	navigation,
	links,
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
	return {
		open: {
			x,
			y,
			width,
			height: Math.min(
				Math.ceil(panelRect.height) + borders,
				availableHeight,
			),
			'indicator-x': trigger.offsetLeft,
			'indicator-width': trigger.offsetWidth,
		},
		folded: {
			x: triggerRect.left - headerRect.left,
			y: y - PANEL_GAP - FOLD_HEIGHT,
			width: triggerRect.width,
			height: FOLD_HEIGHT,
		},
		maxHeight: {
			dropdown: availableHeight,
			panel: availableHeight - borders,
		},
	}
}
