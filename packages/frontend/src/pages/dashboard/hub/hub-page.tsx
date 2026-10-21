import { useRef } from 'react'

import { HUB_PAGES } from '@entities/hub/api'
import { useEntrance } from '@shared/lib/use-entrance'
import { TextLink } from '@shared/ui/text-link'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'
import { JournalFeed } from '../journal/journal-feed'
import { OpenCommands } from '../react/open-commands'
import { PageHead } from '../react/page-head'
import { PageSection } from '../react/page-section'
import { dashboardPage } from '../react/page.styles'
import { pageSection } from '../react/section.styles'

import { AgentsOnHub } from './agents-on-hub'
import { FactList } from './fact-list'
import { hubFacts } from './hub-facts'
import { streamFacts } from './stream-facts'

import type { HubLink } from '@entities/hub/link'
import type { HubHealth } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'

// The full journal the Hub page shows; the hub keeps more than a page needs.
const JOURNAL_ROWS = 200

// What this hub runs and who it lets in.
function HealthSection({
	health,
	now,
}: {
	health: HubHealth | null
	now: number
}): ReactElement {
	return (
		<PageSection
			title="Health"
			note="What this hub runs and who it lets in. A restart keeps every desk on the same address."
		>
			{health ? (
				<FactList facts={hubFacts(health, now)} />
			) : (
				<p {...stylex.props(pageSection.note)}>Reading the hub…</p>
			)}
		</PageSection>
	)
}

// How this page follows the hub, as the stream stands now.
function StreamSection({
	link,
	now,
}: {
	link: HubLink
	now: number
}): ReactElement {
	return (
		<PageSection
			title="Stream"
			note="How this page follows the hub: one socket, down which the hub pushes every change. It tries again by itself when it drops."
		>
			<FactList facts={streamFacts(link, now)} />
		</PageSection>
	)
}

// The page's head; on a hub behind an access key, the way to sign this browser out.
function HubHead({
	desks,
	isKeyed,
}: {
	desks: number
	isKeyed: boolean
}): ReactElement {
	return (
		<PageHead
			title="Hub"
			lede={`One process on this machine hosts every desk: ${plural(desks, 'desk')} now. Agents never run a server; they open desks here.`}
		>
			{isKeyed && (
				<TextLink href={HUB_PAGES.signOut} small>
					Sign out
				</TextLink>
			)}
		</PageHead>
	)
}

// The hub itself: its health, this page's stream from it, the agents attached to it now, how an
// agent opens a desk on it, and the whole journal.
export function HubPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'hub')
	const { health, now } = dashboard.hub
	const desks = dashboard.listed?.desks ?? []
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<HubHead
				desks={desks.length}
				isKeyed={health?.keyRequired === true}
			/>
			<HealthSection health={health} now={now} />
			<StreamSection link={dashboard.hub.link} now={now} />
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
			<PageSection
				title="Journal"
				note="Every open, round, question and close on this hub, newest first. It stays on this machine."
			>
				<JournalFeed
					journal={dashboard.journal}
					events={dashboard.journal.events.slice(-JOURNAL_ROWS)}
					livePaths={dashboard.livePaths}
					now={now}
					emptyText="Nothing recorded yet."
				/>
			</PageSection>
		</div>
	)
}
