import { compact } from './compact'

import type { GeometryName } from './navigation-channels'

// The dropdown's geometry, read from the layout and never written to it:
// the width a panel may take, where the open panel lands independently of
// the shell's current animated size, the folded sliver under its trigger it
// grows from and shrinks back into, and the heights the viewport leaves.
const BORDER_WIDTH = 2
const PANEL_GAP = 10
const MOBILE_INSET = 12
const DESKTOP_INSET = 24
const FOLD_HEIGHT = 4
// The inset applies on both sides of the bar.
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

const inset = (): number => (compact.matches ? MOBILE_INSET : DESKTOP_INSET)

// The width a panel may take between the bar's insets.
export const availableWidth = (navigation: HTMLElement): number =>
	navigation.clientWidth - inset() * SIDES - BORDER_WIDTH

export function measureNavigation({
	navigation,
	links,
	trigger,
	panel,
}: MeasureInput): Geometry {
	const isCompact = compact.matches
	const margin = inset()
	const headerRect = navigation.getBoundingClientRect()
	const triggerRect = trigger.getBoundingClientRect()
	const panelRect = panel.getBoundingClientRect()
	const width = Math.ceil(panelRect.width) + BORDER_WIDTH
	const left = isCompact ? margin : triggerRect.left - headerRect.left
	const x = Math.max(
		margin,
		Math.min(left, navigation.clientWidth - width - margin),
	)
	// Mobile links have an entrance transform; measure their settled layout.
	const anchorBottom = isCompact
		? links.offsetTop + links.offsetHeight
		: triggerRect.bottom - headerRect.top
	const y = anchorBottom + PANEL_GAP
	const availableHeight = window.innerHeight - headerRect.top - y - margin
	return {
		open: {
			x,
			y,
			width,
			height: Math.min(
				Math.ceil(panelRect.height) + BORDER_WIDTH,
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
			panel: availableHeight - BORDER_WIDTH,
		},
	}
}
