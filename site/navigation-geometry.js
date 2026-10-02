const borderWidth = 2
const panelGap = 10
const mobileInset = 12
const desktopInset = 24
const foldHeight = 4

// Measure the destination independently of the shell's current animated size.
export function measureNavigation(navigation, trigger, panel, compact) {
	const isCompact = compact.matches
	const inset = isCompact ? mobileInset : desktopInset
	const available = navigation.clientWidth - inset * 2 - borderWidth
	navigation.style.setProperty('--nav-available', `${available}px`)
	if (!panel) return
	const links = navigation.querySelector('.nav-links')
	const headerRect = navigation.getBoundingClientRect()
	const triggerRect = trigger.getBoundingClientRect()
	const panelRect = panel.getBoundingClientRect()
	const width = Math.ceil(panelRect.width) + borderWidth
	const left = isCompact ? inset : triggerRect.left - headerRect.left
	const x = Math.max(inset, Math.min(left, navigation.clientWidth - width - inset))
	// Mobile links have an entrance transform; measure their settled layout.
	const anchorBottom = isCompact ? links.offsetTop + links.offsetHeight : triggerRect.bottom - headerRect.top
	const y = anchorBottom + panelGap
	const availableHeight = window.innerHeight - headerRect.top - y - inset
	navigation.style.setProperty('--dropdown-max-height', `${availableHeight}px`)
	navigation.style.setProperty('--panel-max-height', `${availableHeight - borderWidth}px`)
	return {
		open: {
			x,
			y,
			width,
			height: Math.min(Math.ceil(panelRect.height) + borderWidth, availableHeight),
			'indicator-x': trigger.offsetLeft,
			'indicator-width': trigger.offsetWidth,
		},
		folded: {
			x: triggerRect.left - headerRect.left,
			y: y - panelGap - foldHeight,
			width: triggerRect.width,
			height: foldHeight,
		},
	}
}
