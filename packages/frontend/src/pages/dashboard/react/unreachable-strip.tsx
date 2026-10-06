import { hubPlace } from '@entities/hub/hub-place'
import { Code } from '@shared/ui/code'
import * as stylex from '@stylexjs/stylex'

import { unreachableStrip } from './unreachable-strip.styles'

import type { HubPlace } from '@entities/hub/hub-place'
import type { ReactElement } from 'react'

const RESTART: Record<HubPlace, ReactElement> = {
	loopback: (
		<>
			run <Code onPaper>syneva start</Code> on its machine
		</>
	),
	network: (
		<>
			start it again on its machine with the same{' '}
			<Code onPaper>--host</Code> and <Code onPaper>--key</Code>
		</>
	),
}

// What a screen reader hears on a row's link (its aria-describedby), written once from the same fields and words: read in a run the visible columns and annotations would lose their stops, so the row's description is spelled as sentences.
export function UnreachableStrip({
	isShown,
}: {
	isShown: boolean
}): ReactElement {
	return (
		<div role="status">
			{isShown && (
				<div {...stylex.props(unreachableStrip.root)}>
					<span
						{...stylex.props(unreachableStrip.square)}
						aria-hidden="true"
					/>
					<p>
						<span {...stylex.props(unreachableStrip.lead)}>
							The hub is not answering.
						</span>{' '}
						<span {...stylex.props(unreachableStrip.rest)}>
							If it was stopped, {RESTART[hubPlace()]}. This page
							keeps the last listing and reconnects by itself.
						</span>
					</p>
				</div>
			)}
		</div>
	)
}
