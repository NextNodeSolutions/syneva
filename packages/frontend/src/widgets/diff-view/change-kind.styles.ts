import { deskSize } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A changed file's kind as a tone - green added, petrol modified, red deleted,
// amber renamed, muted for a plain file - shared by the diff header's file icon
// and the oversized card's icon and kind label, so both surfaces name a change
// alike. A static style per kind: the tone is picked, never computed.
export const changeTone = stylex.create({
	added: { color: color['--green'] },
	modified: { color: color['--accent'] },
	deleted: { color: color['--red'] },
	renamed: { color: color['--amber'] },
	plain: { color: color['--muted'] },
})

// The +added / -removed pair a file prints beside its name, in mono figures
// and the same gap on every surface; the caller sets the size.
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
