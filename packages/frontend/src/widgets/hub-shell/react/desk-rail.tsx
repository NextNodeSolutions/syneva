import { useCallback, useMemo, useRef, useState } from 'react'

import { desksOfTurn } from '@entities/hub/turn'
import { useHub } from '@entities/hub/use-hub'
import { useDismiss } from '@shared/lib/use-dismiss'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { navCountsOf } from '../nav'
import { useShellKeys } from '../use-shell-keys'

import { deskRail } from './desk-rail.styles'
import { HubSidebar } from './hub-sidebar'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

// The other desks waiting on the reviewer, from the open rail: the next review is one click
// away, without going back to the overview.
function WaitingDesks({ desks }: { desks: readonly HubDesk[] }): ReactElement {
	return (
		<nav aria-labelledby="rail-waiting" {...stylex.props(deskRail.waiting)}>
			<p id="rail-waiting" {...stylex.props(deskRail.waitingLabel)}>
				Also waiting on you
			</p>
			<ul {...stylex.props(deskRail.waitingList)}>
				{desks.map(desk => (
					<li key={desk.id}>
						<a
							href={desk.path}
							{...stylex.props(focus.inset, deskRail.waitingLink)}
						>
							<LiveDot tone="petrol" />
							<span {...stylex.props(deskRail.waitingName)}>
								{desk.session}{' '}
								<span
									{...stylex.props(deskRail.waitingProject)}
								>
									{desk.project}
								</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}

// The hub's navigation at the desk's left edge: folded to its icons (the count of desks waiting
// on the reviewer on the overview's), opened over the desk by its toggle or [, closed by
// Escape, a press outside or a resize. The review in the desk never moves for it.
export function DeskRail({ deskId }: { deskId: string }): ReactElement {
	const hub = useHub()
	const [isOpen, setOpen] = useState(false)
	const panel = useRef<HTMLDivElement>(null)
	const toggle = useCallback(() => setOpen(was => !was), [])
	const parts = useMemo(() => [panel], [])
	const close = useCallback(() => setOpen(false), [])
	useShellKeys(toggle)
	useDismiss({ isOpen, parts, onDismiss: close })
	const waiting = desksOfTurn(hub.desks ?? [], 'yours').filter(
		desk => desk.id !== deskId,
	)
	return (
		// data-desk: the desk's scoped element defaults (box sizing, focus) reach the rail too.
		<div data-desk="" {...stylex.props(deskRail.rail)}>
			<div
				ref={panel}
				{...stylex.props(deskRail.panel, isOpen && deskRail.panelOpen)}
			>
				<HubSidebar
					model={{
						pathname: window.location.pathname,
						counts: navCountsOf(hub.desks),
						status: hub.status,
						version: hub.health?.version ?? null,
					}}
					fold={{ isFolded: !isOpen, toggle }}
					newReview={null}
				>
					{isOpen && waiting.length > 0 && (
						<WaitingDesks desks={waiting} />
					)}
				</HubSidebar>
			</div>
		</div>
	)
}
