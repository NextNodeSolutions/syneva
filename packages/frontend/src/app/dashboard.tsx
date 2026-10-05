import '@syneva/design-system/fonts.css'
import { createRoot } from 'react-dom/client'

import { Dashboard } from '@pages/dashboard/react/dashboard'
import { $ } from '@shared/lib/dom'
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

// The hub dashboard's bootstrap: one React root over the hub listing. It shares the design
// system and the entity/shared layers with the desk, but none of the desk's store - a
// dashboard has no review to hold, only the hub to watch.
const root = $('root')
const { className } = stylex.props(documentRoot.base)
if (className) root.className = className
createRoot(root).render(<Dashboard />)
