import { useRef } from 'react'

import { HUB_PAGES } from '@entities/hub/api'
import { useEntrance } from '@shared/lib/use-entrance'
import { TextLink } from '@shared/ui/text-link'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'
import { OpenCommands } from '../react/open-commands'
import { PageHead } from '../react/page-head'
import { PageSection } from '../react/page-section'
import { dashboardPage } from '../react/page.styles'

import { AgentsOnHub } from './agents-on-hub'
import { JournalSection } from './hub-journal-section'
import { HealthSection, StreamSection } from './hub-status-sections'
import { WebLinkSections } from './web-link-sections'

import type { HubMode } from '@entities/hub/mode'
import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'

// The page's head; on a hub behind an access key, the way to sign this browser out.
function HubHead({
	desks,
	isKeyed,
	mode,
}: {
	desks: number
	isKeyed: boolean
	mode: HubMode | null
}): ReactElement {
	return (
		<PageHead
			title="Hub"
			lede={
				mode === 'web'
					? `The web relays this page to the hubs you paired: ${plural(desks, 'desk')} now. Agents never run a server; they open desks on their own hub.`
					: `One process on this machine hosts every desk: ${plural(desks, 'desk')} now. Agents never run a server; they open desks here.`
			}
		>
			{isKeyed && (
				<TextLink href={HUB_PAGES.signOut} small>
					Sign out
				</TextLink>
			)}
		</PageHead>
	)
}

// The hub itself: its health, this page's stream from it, its pairing with the web (or, on the
// web, the hubs paired with it), the agents attached to it now, how an agent opens a desk on it,
// and the whole journal. On the web the account and the hubs lead, since they are what the page
// is for there.
export function HubPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'hub')
	const { health, now, mode } = dashboard.hub
	const desks = dashboard.listed?.desks ?? []
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<HubHead
				desks={desks.length}
				isKeyed={health?.keyRequired === true}
				mode={mode}
			/>
			{mode === 'web' && <WebLinkSections mode={mode} now={now} />}
			<HealthSection health={health} now={now} mode={mode} />
			<StreamSection link={dashboard.hub.link} now={now} mode={mode} />
			{mode !== 'web' && <WebLinkSections mode={mode} now={now} />}
			<PageSection
				title="Agents"
				note="The agents attached now: parked on a desk waiting for you, or at work on what you sent."
			>
				<AgentsOnHub desks={desks} now={now} />
			</PageSection>
			<PageSection
				title="Connect an agent"
				note="Your agent opens a desk from inside its repository; the hub starts by itself if it is not running."
			>
				<div>
					<OpenCommands />
				</div>
			</PageSection>
			<JournalSection dashboard={dashboard} />
		</div>
	)
}
