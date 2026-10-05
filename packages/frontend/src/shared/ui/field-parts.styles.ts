import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The words around a field: its label (with an aside such as "optional" at
// the row's end), then the hint under it, which an error replaces. Margins
// are set both ways because the desk's shell has no reset for p.
export const fieldParts = stylex.create({
	labelRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: '12px',
	},
	label: { fontSize: '13px', fontWeight: 500, color: color['--ink'] },
	hint: {
		marginTop: '7px',
		marginBottom: 0,
		fontSize: '12.5px',
		lineHeight: 1.45,
		color: color['--muted'],
	},
	error: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginTop: '7px',
		marginBottom: 0,
		fontSize: '12.5px',
		lineHeight: 1.45,
		color: color['--red'],
	},
	// The control under its label row.
	control: { marginTop: '8px' },
})
