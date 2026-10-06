import '@syneva/design-system/fonts.css'
import { createRoot } from 'react-dom/client'

import { fetchHubPrefs } from '@entities/settings/api'
import { applyAppearance, DEFAULT_SETTINGS } from '@entities/settings/settings'
import { Dashboard } from '@pages/dashboard/react/dashboard'
import { $ } from '@shared/lib/dom'
import { routeInPage } from '@shared/lib/router'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The document the dashboard renders into: the public site's paper field and its two voices,
// set on the root rather than on body because the stylesheet is shared with the desk page.
// Every figure on the page is a count or a time that changes in place, so digits keep one
// width and a column of them never shifts.
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

// How long the first paint waits for the reviewer's appearance: a hub answers well within it,
// and a hub that does not is shown in the light default rather than kept blank.
const PREFS_WAIT_MS = 600

// The hub dashboard's bootstrap: the reviewer's appearance (the same settings file every desk
// reads) before the first paint, so a night-mode reviewer never sees the light field flash,
// then one React root over the shell and its pages. It shares the design system and the
// entity/shared layers with the desk, but none of the desk's store.
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
