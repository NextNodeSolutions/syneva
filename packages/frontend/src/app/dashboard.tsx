import '@syneva/design-system/fonts.css'
import { createRoot } from 'react-dom/client'

import { fetchHubPrefs } from '@entities/settings/api'
import { applyAppearance, DEFAULT_SETTINGS } from '@entities/settings/settings'
import { Dashboard } from '@pages/dashboard/react/dashboard'
import { $ } from '@shared/lib/dom'
import { routeInPage } from '@shared/lib/router'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// Set on the root rather than body because the stylesheet is shared with the desk page; every figure is a count or time changing in place, so digits keep one width and a column of them never shifts.
const documentRoot = stylex.create({
	base: {
		minHeight: '100vh',
		backgroundColor: color['--paper'],
		color: color['--ink'],
		fontFamily: font['--sans'],
		fontSize: '15px',
		lineHeight: 1.55,
		WebkitFontSmoothing: 'antialiased',
		textRendering: 'optimizeLegibility',
		fontVariantNumeric: 'tabular-nums',
	},
})

// How long the first paint waits for the reviewer's appearance: a hub answers well within it, and one that does not shows the light default rather than a blank page.
const PREFS_WAIT_MS = 600

// The hub dashboard's bootstrap: the reviewer's appearance before the first paint (the same settings file every desk reads), so a night-mode reviewer never sees the light field flash.
// One React root over the shell and its pages; shares the design and entity layers with the desk, none of its store.
async function boot(): Promise<void> {
	const prefs = await fetchHubPrefs(AbortSignal.timeout(PREFS_WAIT_MS)).catch(
		() => null,
	)
	applyAppearance({ ...DEFAULT_SETTINGS, ...prefs?.settings })
	routeInPage()
	const root = $('root')
	const { className } = stylex.props(documentRoot.base)
	if (className) root.className = className
	createRoot(root).render(<Dashboard />)
}

void boot()
