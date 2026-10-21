import { useState } from 'react'

import { useHubList } from '@entities/hub/use-hubs'
import { Button } from '@shared/ui/button'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { offlineWords } from '../hub-copy'
import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import { FactList } from './fact-list'
import { RevokeHubDialog } from './revoke-hub-dialog'

import type { HubRef } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { Fact } from './fact-list'

const hubRow = stylex.create({
	row: {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		paddingBlock: '14px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	head: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
	},
	name: { flex: '1', minWidth: 0, fontSize: '14px', fontWeight: 500 },
})

const NOTE =
	'The machines you paired with syneva login. Each keeps one socket open to the web while it runs; its desks are reviewed from here as long as it is online.'

function factsOf(hub: HubRef, now: number): Fact[] {
	return [
		{
			key: 'State',
			value: hub.isOnline ? 'Online' : offlineWords(hub, now),
		},
		{ key: 'CLI version', value: hub.version ?? 'Not reported' },
		{ key: 'Hub id', value: hub.id },
	]
}

function HubRow({
	hub,
	now,
	onRevoke,
}: {
	hub: HubRef
	now: number
	onRevoke: () => void
}): ReactElement {
	return (
		<li {...stylex.props(hubRow.row)}>
			<div {...stylex.props(hubRow.head)}>
				<LiveDot
					tone={hub.isOnline ? 'signal' : 'neutral'}
					hollow={!hub.isOnline}
				/>
				<span {...stylex.props(hubRow.name)}>{hub.name}</span>
				<Button
					tone="outlined"
					size="small"
					aria-label={`Revoke ${hub.name}`}
					onClick={onRevoke}
				>
					Revoke
				</Button>
			</div>
			<FactList facts={factsOf(hub, now)} />
		</li>
	)
}

// The person's paired hubs as the web lists them (its `hub` frames, the store's): where each
// stands and what it runs, with the one action the web owns, revoking one. A revoked hub leaves
// the list once the web answers, here or on any page that reads the web again, as it is no longer
// one of the person's hubs.
export function WebHubsSection({ now }: { now: number }): ReactElement {
	const hubs = useHubList()
	const [revoking, setRevoking] = useState<HubRef | null>(null)
	return (
		<PageSection title="Your hubs" note={NOTE}>
			{hubs.length ? (
				<ul>
					{hubs.map(hub => (
						<HubRow
							key={hub.id}
							hub={hub}
							now={now}
							onRevoke={() => setRevoking(hub)}
						/>
					))}
				</ul>
			) : (
				<p {...stylex.props(pageSection.note)}>
					No hub is paired yet: run syneva login on a machine to
					review its desks from here.
				</p>
			)}
			{revoking && (
				<RevokeHubDialog
					hub={revoking}
					onRevoked={() => setRevoking(null)}
					onClose={() => setRevoking(null)}
				/>
			)}
		</PageSection>
	)
}
