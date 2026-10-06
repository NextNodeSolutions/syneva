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
import { sidebar } from './hub-sidebar.styles'
import { RailTip } from './rail-tip'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

// The other desks waiting on the reviewer, from the open rail: the next review is one click
// away, without going back to the overview. It stays in place while the rail is folded, faded
// with the labels and out of reach (inert), so opening the rail never moves the icons.
function WaitingDesks({
	desks,
	isShown,
}: {
	desks: readonly HubDesk[]
	isShown: boolean
}): ReactElement {
	return (
		<nav
			aria-labelledby="rail-waiting"
			inert={!isShown}
			{...stylex.props(
				deskRail.waiting,
				sidebar.label,
				!isShown && sidebar.labelFolded,
			)}
		>
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
		// data-hub-rail: the desk's hotkeys leave the rail's keys alone (rail-hook.ts).
		<div data-desk="" data-hub-rail="" {...stylex.props(deskRail.rail)}>
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
					{waiting.length > 0 && (
						<WaitingDesks desks={waiting} isShown={isOpen} />
					)}
				</HubSidebar>
			</div>
			<RailTip scope={panel} />
		</div>
	)
}
