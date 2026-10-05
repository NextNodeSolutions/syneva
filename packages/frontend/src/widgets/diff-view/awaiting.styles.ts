import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The line under a question no agent reply has followed yet: petrol, led by
// the live dot while it waits on an attached agent; amber, the dot still, once
// the question is queued for want of one. The agent's own status line reads in
// full ink - it is the informative part.
export const awaiting = stylex.create({
	line: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: '6px',
		fontSize: deskText.small,
		color: color['--accent'],
	},
	queued: { color: color['--amber'] },
	activity: { minWidth: 0, color: color['--ink'] },
})
