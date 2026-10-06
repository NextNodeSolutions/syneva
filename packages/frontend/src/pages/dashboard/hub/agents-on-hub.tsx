import { deskStage } from '@entities/hub/stage'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { relativeTime } from '../format'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

const agents = stylex.create({
	row: {
		display: 'grid',
		gridTemplateColumns: '14px minmax(0, 1fr) auto',
		alignItems: 'baseline',
		columnGap: '12px',
		paddingBlock: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: '13px',
	},
	link: {
		color: { default: color['--ink'], ':hover': color['--accent'] },
		textDecoration: 'none',
		fontWeight: 500,
	},
	what: { fontSize: '12.5px', color: color['--muted'] },
	when: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	empty: { fontSize: '13px', color: color['--muted'] },
})

// An agent attached to a desk: parked on it (the review is the reviewer's to send), or at work
// with the line it last posted.
function stateOf(desk: HubDesk): { words: string; isWorking: boolean } {
	const stage = deskStage(desk)
	if (stage.kind === 'working')
		return { words: stage.activity.body, isWorking: true }
	return { words: 'Waiting for your review', isWorking: false }
}

export function AgentsOnHub({
	desks,
	now,
}: {
	desks: readonly HubDesk[]
	now: number
}): ReactElement {
	const attached = desks.filter(
		desk => desk.agentListening || desk.agentActivity,
	)
	if (!attached.length)
		return (
			<p {...stylex.props(agents.empty)}>
				No agent is attached right now.
			</p>
		)
	return (
		<ul>
			{attached.map(desk => {
				const state = stateOf(desk)
				return (
					<li key={desk.id} {...stylex.props(agents.row)}>
						<LiveDot
							tone={state.isWorking ? 'signal' : 'petrol'}
							live={state.isWorking}
						/>
						<span>
							<a
								href={desk.path}
								{...stylex.props(focus.ring, agents.link)}
							>
								{desk.session}
							</a>{' '}
							<span {...stylex.props(agents.what)}>
								· {desk.project} · {state.words}
							</span>
						</span>
						<span {...stylex.props(agents.when)}>
							{relativeTime(desk.lastActivityAt, now)}
						</span>
					</li>
				)
			})}
		</ul>
	)
}
