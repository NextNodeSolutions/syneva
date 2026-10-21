import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// One paired hub on the web's Hub page: its dot, name and action over its facts, rows under a
// hairline.
export const hubRow = stylex.create({
	row: {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		paddingBlock: '14px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	head: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
	},
	name: { flex: '1', minWidth: 0, fontSize: '14px', fontWeight: 500 },
})
