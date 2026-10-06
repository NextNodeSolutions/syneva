import { Popover } from '@shared/ui/popover'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { LAYOUTS } from '../display'

import { MenuCheck } from './menu-check'
import { menu } from './menu.styles'

import type { ShellIconName } from '@widgets/hub-shell/shell-icons'
import type { ReactElement } from 'react'
import type { Layout } from '../display'
import type { Grouping } from '../groups'
import type { DisplayPrefsState } from '../use-display-prefs'

const LAYOUT_FACE: Record<Layout, { label: string; icon: ShellIconName }> = {
	circuit: { label: 'Circuit', icon: 'overview' },
	board: { label: 'Board', icon: 'board' },
	cockpit: { label: 'Cockpit', icon: 'cockpit' },
}

const GROUPINGS: readonly { id: Grouping; label: string }[] = [
	{ id: 'turn', label: 'By turn' },
	{ id: 'project', label: 'By project' },
]

function LayoutTiles({
	layout,
	onLayout,
}: {
	layout: Layout
	onLayout: (layout: Layout) => void
}): ReactElement {
	return (
		<div {...stylex.props(menu.tiles)}>
			{LAYOUTS.map(option => (
				<button
					key={option}
					type="button"
					aria-pressed={option === layout}
					onClick={() => onLayout(option)}
					{...stylex.props(
						focus.ring,
						menu.tile,
						option === layout && menu.tileOn,
					)}
				>
					<ShellIcon name={LAYOUT_FACE[option].icon} />
					{LAYOUT_FACE[option].label}
				</button>
			))}
		</div>
	)
}

function GroupingChoice({ prefs }: { prefs: DisplayPrefsState }): ReactElement {
	return (
		<div
			{...stylex.props(menu.segmented)}
			role="group"
			aria-label="Group the list"
		>
			{GROUPINGS.map(option => (
				<button
					key={option.id}
					type="button"
					aria-pressed={prefs.grouping === option.id}
					onClick={() => prefs.change({ grouping: option.id })}
					{...stylex.props(
						focus.inset,
						menu.segment,
						prefs.grouping === option.id && menu.segmentOn,
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	)
}

const FACE = (
	<>
		<ShellIcon name="display" />
		Display
	</>
)

// Display: how the overview shows the same desks. The three displays as tiles (the circuit,
// the board, the cockpit), how the lists group, and what they show. Every choice applies at
// once, behind the open panel.
export function DisplayMenu({
	layout,
	onLayout,
	prefs,
}: {
	layout: Layout
	onLayout: (layout: Layout) => void
	prefs: DisplayPrefsState
}): ReactElement {
	return (
		<Popover trigger={{ face: FACE, isActive: false }} label="Display">
			<div {...stylex.props(menu.section)}>
				<p {...stylex.props(menu.label)}>Layout</p>
				<LayoutTiles layout={layout} onLayout={onLayout} />
			</div>
			<div {...stylex.props(menu.section)}>
				<p {...stylex.props(menu.label)}>Group the list</p>
				<GroupingChoice prefs={prefs} />
			</div>
			<div {...stylex.props(menu.section, menu.sectionLast)}>
				<p {...stylex.props(menu.label)}>Show</p>
				<MenuCheck
					label="Idle desks"
					isChecked={prefs.showsIdle}
					onToggle={() =>
						prefs.change({ showsIdle: !prefs.showsIdle })
					}
				/>
				<MenuCheck
					label="Journal"
					isChecked={prefs.showsJournal}
					onToggle={() =>
						prefs.change({ showsJournal: !prefs.showsJournal })
					}
				/>
			</div>
		</Popover>
	)
}
