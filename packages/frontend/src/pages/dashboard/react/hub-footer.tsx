import { LiveDot } from '@shared/ui/live-dot'
import { run } from '@shared/ui/run.styles'
import * as stylex from '@stylexjs/stylex'

import { MS_PER_SECOND, plural, relativeTime, unbroken } from '../format'
import { HUB_POLL_MS } from '../use-hub'

import { hubFooter } from './hub-footer.styles'

import type { HubHealth } from '@entities/hub/model'
import type { DotTone } from '@shared/ui/live-dot'
import type { ReactElement } from 'react'
import type { FooterListing } from '../use-dashboard'
import type { HubStatus } from '../use-hub'

// The poll's cadence, as the footer states it: one unit, never parted from its number.
const EVERY = unbroken(`every ${HUB_POLL_MS / MS_PER_SECOND} s`)

type HubFooterProps = {
	status: HubStatus
	// Null before the first listing, and while signed out (the listing is hidden).
	listing: FooterListing | null
	health: HubHealth | null
	now: number
}

const STATE: Record<HubStatus, { tone: DotTone; word: string }> = {
	connecting: { tone: 'neutral', word: 'Connecting…' },
	live: { tone: 'signal', word: 'Live' },
	unreachable: { tone: 'red', word: 'Not answering' },
	'signed-out': { tone: 'neutral', word: 'Signed out' },
}

// What follows the state word: the poll's cadence while live, how old the kept listing is
// while the hub does not answer.
function stateNote(
	status: HubStatus,
	syncedAt: number | null | undefined,
	now: number,
): string | null {
	if (status === 'live') return `checks ${EVERY}`
	if (status !== 'unreachable') return null
	if (!syncedAt) return `retrying ${EVERY}`
	return unbroken(`last listing ${relativeTime(syncedAt, now)}`)
}

function countNote(listing: HubFooterProps['listing']): string | null {
	if (!listing) return null
	if (!listing.desks) return unbroken('no desks')
	const projects = unbroken(`in ${plural(listing.projects, 'project')}`)
	return `${unbroken(plural(listing.desks, 'desk'))} ${projects}`
}

// The footer bar. Only the state word is a live region: it changes when the hub's answer
// does, never on a poll that says the same. Its state is a run (shared/ui/run.styles) that
// breaks between its parts and at the units inside one ("5 desks" / "in 3 projects"), never
// inside a unit, and shows a separator only between two parts of a line.
export function HubFooter({
	status,
	listing,
	health,
	now,
}: HubFooterProps): ReactElement {
	const state = STATE[status]
	const notes = [
		stateNote(status, listing?.syncedAt, now),
		countNote(listing),
	]
	return (
		<footer {...stylex.props(hubFooter.root)}>
			<p {...stylex.props(run.clip)}>
				<span {...stylex.props(run.parts)}>
					<span {...stylex.props(run.part)}>
						<LiveDot tone={state.tone} css={hubFooter.dot} />
						<span role="status">{state.word}</span>
					</span>
					{notes
						.filter(note => note !== null)
						.map(note => (
							<span key={note} {...stylex.props(run.part)}>
								{note}
							</span>
						))}
				</span>
			</p>
			<p>
				{window.location.host}
				{health && ` · v${health.version}`}
			</p>
		</footer>
	)
}
