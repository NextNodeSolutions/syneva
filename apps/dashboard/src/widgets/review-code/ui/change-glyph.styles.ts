import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const changeGlyph = stylex.create({
	new: { color: color['--green'] },
	change: { color: color['--accent'] },
	deleted: { color: color['--red'] },
	'rename-pure': { color: color['--amber'] },
	'rename-changed': { color: color['--amber'] },
})
