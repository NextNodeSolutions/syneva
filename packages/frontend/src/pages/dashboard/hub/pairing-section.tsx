import { usePairing } from '@entities/hub/use-pairing'
import { CommandChip } from '@shared/ui/command-chip'
import * as stylex from '@stylexjs/stylex'

import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import { FactList } from './fact-list'
import { pairingFacts } from './pairing-facts'

import type { ReactElement } from 'react'

const NOTE =
	'Whether this hub is paired with the web: it then keeps one socket open to it, from this machine, through which you review its desks from anywhere. Nothing listens here for it.'

// The hub's pairing as its stream says it: not paired (and the command that pairs it), or the
// web it is paired with, where its socket stands, and the command that unpairs it.
export function PairingSection({ now }: { now: number }): ReactElement {
	const pairing = usePairing()
	return (
		<PageSection title="Pairing" note={NOTE}>
			{pairing?.paired ? (
				<>
					<FactList facts={pairingFacts(pairing, now)} />
					{pairing.link.state === 'stopped' && (
						<CommandChip
							command="syneva login"
							label="Command to pair this hub again"
							block
						/>
					)}
					<p {...stylex.props(pageSection.note)}>
						To unpair it, run this on this machine:
					</p>
					<CommandChip
						command="syneva logout"
						label="Command to unpair this hub"
						block
					/>
				</>
			) : (
				<>
					<p {...stylex.props(pageSection.note)}>
						Not paired: run this on this machine to review its desks
						from the web.
					</p>
					<CommandChip
						command="syneva login"
						label="Command to pair this hub with the web"
						block
					/>
				</>
			)}
		</PageSection>
	)
}
