import * as stylex from '@stylexjs/stylex'

import { guidePending as styles } from './guide-pending.styles'

import type { ReactElement } from 'react'

// A repo or pr desk is guided by default: until the agent attaches the guide the desk reads in tree order and says so; an open with --no-guide never shows this.
export function GuidePending(): ReactElement {
	return (
		<div {...stylex.props(styles.note)} role="status" data-guide-pending="">
			Waiting for the guide. Your agent authors it against{' '}
			<span {...stylex.props(styles.code)}>syneva inventory</span> and
			attaches it with{' '}
			<span {...stylex.props(styles.code)}>syneva reload --guide</span>;
			the files read in tree order meanwhile.
		</div>
	)
}
