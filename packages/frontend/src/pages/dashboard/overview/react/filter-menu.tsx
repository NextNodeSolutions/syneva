import { Popover } from '@shared/ui/popover'
import { sectionLabel } from '@shared/ui/section-label.styles'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { FILTER_TRIGGER_ID } from '../../focus-targets'
import { MODE_KEYS, modeKeyOf } from '../display'
import { MODE_NAMES } from '../filter-names'

import { MenuCheck } from './menu-check'
import { menu } from './menu.styles'

import type { HubDesk, HubProject } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DeskFilter } from '../display'

function toggled<T>(list: readonly T[], entry: T): T[] {
	return list.includes(entry)
		? list.filter(kept => kept !== entry)
		: [...list, entry]
}

type FilterMenuProps = {
	desks: readonly HubDesk[]
	projects: readonly HubProject[]
	filter: DeskFilter
	onFilter: (filter: DeskFilter) => void
}

function FilterLists({
	desks,
	projects,
	filter,
	onFilter,
}: FilterMenuProps): ReactElement {
	return (
		<>
			<div {...stylex.props(menu.section)}>
				<p {...stylex.props(sectionLabel.base, menu.label)}>Project</p>
				{projects.map(project => (
					<MenuCheck
						key={project.id}
						label={project.name}
						count={project.desks.length}
						isChecked={filter.projects.includes(project.id)}
						onToggle={() =>
							onFilter({
								...filter,
								projects: toggled(filter.projects, project.id),
							})
						}
					/>
				))}
			</div>
			<div {...stylex.props(menu.section)}>
				<p {...stylex.props(sectionLabel.base, menu.label)}>Review</p>
				{MODE_KEYS.map(mode => (
					<MenuCheck
						key={mode}
						label={MODE_NAMES[mode]}
						count={
							desks.filter(desk => modeKeyOf(desk) === mode)
								.length
						}
						isChecked={filter.modes.includes(mode)}
						onToggle={() =>
							onFilter({
								...filter,
								modes: toggled(filter.modes, mode),
							})
						}
					/>
				))}
			</div>
		</>
	)
}

// Filter: narrow every display to some repositories and some kinds of review. Each line says
// how many live desks it holds; the choices land in the URL.
export function FilterMenu(props: FilterMenuProps): ReactElement {
	const { filter, onFilter } = props
	const active = filter.projects.length + filter.modes.length
	const face = (
		<span {...stylex.props(menu.trigger)}>
			<ShellIcon name="filter" />
			Filter
			{active > 0 && (
				<span {...stylex.props(menu.triggerCount)}>{active}</span>
			)}
		</span>
	)
	return (
		<Popover
			trigger={{ face, isActive: active > 0, id: FILTER_TRIGGER_ID }}
			label="Filter"
		>
			<FilterLists {...props} />
			<div {...stylex.props(menu.section, menu.sectionLast)}>
				<button
					type="button"
					disabled={!active}
					onClick={() => onFilter({ projects: [], modes: [] })}
					{...stylex.props(focus.ring, menu.reset)}
				>
					Clear filters
				</button>
			</div>
		</Popover>
	)
}
