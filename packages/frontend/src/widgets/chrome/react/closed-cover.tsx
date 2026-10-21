import * as stylex from '@stylexjs/stylex'

import { covers } from './desk-covers.styles'

import type { ReactElement } from 'react'

// The desk left the hub: what was kept, and how to open it again.
export function ClosedCover({ session }: { session: string }): ReactElement {
	return (
		<div {...stylex.props(covers.cover)} role="status">
			<div {...stylex.props(covers.card)}>
				<h2 {...stylex.props(covers.title)}>Desk closed.</h2>
				<p {...stylex.props(covers.paragraph)}>
					This desk left the hub. All review state is saved on disk;
					the attached agent was told the review ended.
				</p>
				<p {...stylex.props(covers.paragraph)}>
					Reopen it in the repo with{' '}
					<code {...stylex.props(covers.code)}>
						{`syneva open --session ${session}`}
					</code>
					, or go{' '}
					<a {...stylex.props(covers.link)} href="/">
						back to the dashboard
					</a>
					.
				</p>
			</div>
		</div>
	)
}
