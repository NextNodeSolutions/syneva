import { deskSize } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const changeTone = stylex.create({
	added: { color: color['--green'] },
	modified: { color: color['--accent'] },
	deleted: { color: color['--red'] },
	renamed: { color: color['--amber'] },
	plain: { color: color['--muted'] },
})

export const churn = stylex.create({
	counts: {
		display: 'inline-flex',
		flexShrink: 0,
		gap: deskSize.churnGap,
		fontFamily: font['--mono'],
		fontVariantNumeric: 'tabular-nums',
	},
	added: { color: color['--green'] },
	removed: { color: color['--red'] },
})
