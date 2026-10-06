import { hubPlace } from '@entities/hub/hub-place'
import { Code } from '@shared/ui/code'
import * as stylex from '@stylexjs/stylex'

import { unreachableStrip } from './unreachable-strip.styles'

import type { HubPlace } from '@entities/hub/hub-place'
import type { ReactElement } from 'react'

// How to start the hub again: the plain command for a loopback hub, the way it was started for
// one this browser reaches over the network (hub-place.ts).
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

// Shown over a kept listing while the hub does not answer. Its status region is always
// mounted and only its content comes and goes: a region that appears already filled is not
// announced by every screen reader. It states no time, or it would re-announce on every
// failed poll. The listing under it stays as it was, and stays usable.
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
