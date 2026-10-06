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
import { pageSection } from '../react/section.styles'

import { AgentsOnHub } from './agents-on-hub'
import { hubFacts } from './hub-facts'

import type { HubHealth } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'

// The full journal the Hub page shows; the hub keeps more than a page needs.
const JOURNAL_ROWS = 200

function HealthFacts({
	health,
	now,
}: {
	health: HubHealth | null
	now: number
}): ReactElement {
	if (!health)
		return <p {...stylex.props(pageSection.note)}>Reading the hub…</p>
	return (
		<dl {...stylex.props(pageSection.facts)}>
			{hubFacts(health, now).map(fact => (
				<div key={fact.key} {...stylex.props(pageSection.factRow)}>
					<dt
						{...stylex.props(pageSection.fact, pageSection.factKey)}
					>
						{fact.key}
					</dt>
					<dd
						{...stylex.props(
							pageSection.fact,
							pageSection.factValue,
						)}
					>
						{fact.value}
					</dd>
				</div>
			))}
		</dl>
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

// The hub itself: its health, the agents attached to it now, how an agent opens a desk on it,
// and the whole journal.
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
		<div ref={root} {...stylex.props(pageSection.page)}>
			<HubHead
				desks={desks.length}
				isKeyed={health?.keyRequired === true}
			/>
			<PageSection
				title="Health"
				note="What this hub runs and who it lets in. A restart keeps every desk on the same address."
			>
				<HealthFacts health={health} now={now} />
			</PageSection>
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
