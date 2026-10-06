import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { duration, ease } from '@syneva/design-system/tokens.stylex'

import { sheet } from './signup.stylex'

// The site's figure title bar (shared/ui/figure-top.styles), set in capitals on the sheet's inset.
export const launchBar = stylex.create({
	bar: {
		// Restated under the phone query, where figureTop's padding shorthand would otherwise win.
		paddingInline: { default: sheet.inset, [media.phone]: sheet.inset },
		letterSpacing: '.08em',
		textTransform: 'uppercase',
	},
	status: { display: 'inline-flex', alignItems: 'center', gap: '10px' },
	square: {
		transition: `color ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
})
