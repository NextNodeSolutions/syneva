import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { HUB_STATE } from '../hub-state'

import { sidebar } from './hub-sidebar.styles'
import { railTip } from './rail-tip.styles'
import { ShellIcon } from './shell-icon'
import { sidebarParts } from './sidebar-parts.styles'

import type { HubStatus } from '@entities/hub/use-hub'
import type { ReactElement } from 'react'
import type { SidebarFold } from '../use-sidebar-fold'

// The sidebar's foot: how the hub answers and which version it runs (the old footer bar's
// facts), and the control that folds the sidebar to its rail ([ from anywhere). Only the state
// word is a live region: it changes when the hub's answer does, never on a poll.
export function SidebarFoot({
	status,
	version,
	fold,
}: {
	status: HubStatus
	version: string | null
	fold: SidebarFold
}): ReactElement {
	const state = HUB_STATE[status]
	const action = fold.isFolded ? 'Expand sidebar' : 'Collapse sidebar'
	return (
		<div
			{...stylex.props(sidebar.foot, fold.isFolded && sidebar.footFolded)}
		>
			<p
				{...stylex.props(
					sidebar.status,
					fold.isFolded && sidebar.statusFolded,
				)}
			>
				<LiveDot tone={state.tone} />
				<span role="status">{state.word}</span>
				{version && <span>{`v${version}`}</span>}
			</p>
			<button
				type="button"
				aria-label={action}
				aria-keyshortcuts="["
				data-tip={`${action} ([)`}
				onClick={fold.toggle}
				{...stylex.props(
					press.control,
					control.base,
					control.quiet,
					sidebarParts.foldButton,
					sidebar.foldButton,
					fold.isFolded && sidebar.foldButtonFolded,
					railTip.host,
				)}
			>
				<ShellIcon name={fold.isFolded ? 'unfold' : 'fold'} />
			</button>
		</div>
	)
}
