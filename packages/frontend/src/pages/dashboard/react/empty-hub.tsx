import { Button } from '@shared/ui/button'
import { Code } from '@shared/ui/code'
import { TextLink } from '@shared/ui/text-link'
import * as stylex from '@stylexjs/stylex'

import { emptyHub } from './empty-hub.styles'
import { OpenCommands } from './open-commands'

import type { ReactElement } from 'react'

const SETUP_GUIDE = 'https://syneva.dev/get-started/'

const HEADING_ID = 'empty-hub-title'

// A hub with no desk: how one opens - the agent's command, the same command for the
// reviewer, or New review from here.
export function EmptyHub({
	onNewReview,
}: {
	onNewReview: () => void
}): ReactElement {
	return (
		<section {...stylex.props(emptyHub.root)} aria-labelledby={HEADING_ID}>
			<div>
				<h2 id={HEADING_ID} {...stylex.props(emptyHub.heading)}>
					Open a desk from your repository.
				</h2>
				<p {...stylex.props(emptyHub.text)}>
					Your agent runs <Code onPaper>syneva open</Code> when it has
					changes for you. Run it yourself, or open one from here.
				</p>
				<div {...stylex.props(emptyHub.actions)}>
					<Button
						tone="primary"
						size="large"
						arrow
						onClick={onNewReview}
					>
						New review
					</Button>
					<TextLink href={SETUP_GUIDE} external onWash>
						Setup guide
					</TextLink>
				</div>
			</div>
			<OpenCommands />
		</section>
	)
}
