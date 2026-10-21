import { PairingSection } from './pairing-section'
import { WebAccountSection } from './web-account-section'
import { WebHubsSection } from './web-hubs-section'

import type { HubMode } from '@entities/hub/mode'
import type { ReactElement } from 'react'

// What links this page to the web: on a local hub, whether it is paired (and the commands that
// pair it); on the web, who is signed in and the hubs that are paired. Until the stream says which
// of the two this page is, the page reads as a local hub's (as its head does) and the pairing
// stands with what is known of it, nothing yet: a hub whose stream never answers still shows where
// its pairing goes, and a page the web serves says so with the stream's first frame.
export function WebLinkSections({
	mode,
	now,
}: {
	mode: HubMode | null
	now: number
}): ReactElement {
	if (mode === 'web')
		return (
			<>
				<WebAccountSection />
				<WebHubsSection now={now} />
			</>
		)
	return <PairingSection now={now} />
}
