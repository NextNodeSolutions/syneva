import { usePairing } from '@entities/hub/use-pairing'
import { CommandChip } from '@shared/ui/command-chip'
import * as stylex from '@stylexjs/stylex'

import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import { FactList } from './fact-list'
import { pairingFacts } from './pairing-facts'

import type { HubPairing } from '@entities/hub/pairing'
import type { ReactElement } from 'react'

const NOTE =
	'Whether this hub is paired with the web: it then keeps one socket open to it, from this machine, through which you review its desks from anywhere. Nothing listens here for it.'

// The pairing as the hub's stream last said it: not yet (the stream has not answered, so nothing
// is claimed), not paired (and the command that pairs it), or the web it is paired with, where its
// socket stands, and the command that unpairs it.
function PairingBody({
	pairing,
	now,
}: {
	pairing: HubPairing | null
	now: number
}): ReactElement {
	if (!pairing)
		return <p {...stylex.props(pageSection.note)}>Reading the hub…</p>
	if (!pairing.paired)
		return (
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
		)
	return (
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
	)
}

export function PairingSection({ now }: { now: number }): ReactElement {
	const pairing = usePairing()
	return (
		<PageSection title="Pairing" note={NOTE}>
			<PairingBody pairing={pairing} now={now} />
		</PageSection>
	)
}
