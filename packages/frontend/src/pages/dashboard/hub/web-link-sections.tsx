import { PairingSection } from './pairing-section'
import { WebAccountSection } from './web-account-section'
import { WebHubsSection } from './web-hubs-section'

import type { HubMode } from '@entities/hub/mode'
import type { ReactElement } from 'react'

// What links this page to the web: on a local hub, whether it is paired (and the commands that
// pair it); on the web, who is signed in and the hubs that are paired. Nothing until the stream
// says which of the two this page is.
export function WebLinkSections({
	mode,
	now,
}: {
	mode: HubMode | null
	now: number
}): ReactElement | null {
	if (mode === 'web')
		return (
			<>
				<WebAccountSection />
				<WebHubsSection now={now} />
			</>
		)
	if (mode === 'local') return <PairingSection now={now} />
	return null
}
