import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const domainChips = stylex.create({
	row: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
	title: {
		fontSize: deskText.label,
		color: color['--accent'],
		whiteSpace: 'nowrap',
	},
})
