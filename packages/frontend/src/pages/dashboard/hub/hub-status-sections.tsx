import { useHubList } from '@entities/hub/use-hubs'
import * as stylex from '@stylexjs/stylex'

import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import { FactList } from './fact-list'
import { hubFacts } from './hub-facts'
import { streamFacts } from './stream-facts'

import type { HubLink } from '@entities/hub/link'
import type { HubMode } from '@entities/hub/mode'
import type { HubHealth } from '@entities/hub/model'
import type { ReactElement } from 'react'

// What this hub runs and who it lets in; on the web, what serves the page.
export function HealthSection({
	health,
	now,
	mode,
}: {
	health: HubHealth | null
	now: number
	mode: HubMode | null
}): ReactElement {
	return (
		<PageSection
			title="Health"
			note={
				mode === 'web'
					? 'What serves this page. A deploy drops every socket; your hubs and this tab reconnect by themselves.'
					: 'What this hub runs and who it lets in. A restart keeps every desk on the same address.'
			}
		>
			{health ? (
				<FactList facts={hubFacts(health, now, mode)} />
			) : (
				<p {...stylex.props(pageSection.note)}>Reading the hub…</p>
			)}
		</PageSection>
	)
}

// How this page follows the hub, or on the web the hubs, as the stream stands now.
export function StreamSection({
	link,
	now,
	mode,
}: {
	link: HubLink
	now: number
	mode: HubMode | null
}): ReactElement {
	const list = useHubList()
	return (
		<PageSection
			title="Stream"
			note={
				mode === 'web'
					? 'How this page follows your hubs: one socket to the web, down which it pushes every change. It tries again by itself when it drops.'
					: 'How this page follows the hub: one socket, down which the hub pushes every change. It tries again by itself when it drops.'
			}
		>
			<FactList facts={streamFacts(link, now, { mode, list })} />
		</PageSection>
	)
}
