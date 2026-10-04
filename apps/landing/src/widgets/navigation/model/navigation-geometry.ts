// Measures the dropdown's destination independently of the shell's current
// animated size: where the open panel lands, and the folded sliver under its
// trigger it grows from and shrinks back into.
const BORDER_WIDTH = 2
const PANEL_GAP = 10
const MOBILE_INSET = 12
const DESKTOP_INSET = 24
const FOLD_HEIGHT = 4
// The inset applies on both sides of the bar.
const SIDES = 2

export type Geometry = {
	open: Record<string, number>
	folded: Record<string, number>
}

export type MeasureInput = {
	navigation: HTMLElement
	links: HTMLElement
	trigger: HTMLElement | undefined
	panel: HTMLElement | undefined
	compact: MediaQueryList
}

// The dropdown and its panel never run past the bottom of the viewport.
function capHeight(navigation: HTMLElement, availableHeight: number): void {
	navigation.style.setProperty(
		'--dropdown-max-height',
		`${availableHeight}px`,
	)
	navigation.style.setProperty(
		'--panel-max-height',
		`${availableHeight - BORDER_WIDTH}px`,
	)
}

export function measureNavigation({
	navigation,
	links,
	trigger,
	panel,
	compact,
}: MeasureInput): Geometry | undefined {
	const isCompact = compact.matches
	const inset = isCompact ? MOBILE_INSET : DESKTOP_INSET
	const available = navigation.clientWidth - inset * SIDES - BORDER_WIDTH
	navigation.style.setProperty('--nav-available', `${available}px`)
	if (!panel || !trigger) return undefined
	const headerRect = navigation.getBoundingClientRect()
	const triggerRect = trigger.getBoundingClientRect()
	const panelRect = panel.getBoundingClientRect()
	const width = Math.ceil(panelRect.width) + BORDER_WIDTH
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
	capHeight(navigation, availableHeight)
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
	}
}
