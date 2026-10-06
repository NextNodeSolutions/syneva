import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { isFiltered } from '../display'
import { MODE_NAMES } from '../filter-names'

import { chips } from './filter-chips.styles'

import type { HubProject } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DeskFilter } from '../display'

function Chip({
	kind,
	name,
	onRemove,
}: {
	kind: string
	name: string
	onRemove: () => void
}): ReactElement {
	return (
		<button
			type="button"
			aria-label={`Remove the ${kind} filter ${name}`}
			onClick={onRemove}
			{...stylex.props(focus.ring, chips.chip)}
		>
			<span {...stylex.props(chips.kind)}>{kind}</span>
			{name}
			<ShellIcon name="close" css={chips.cross} />
		</button>
	)
}

// Each filter in force, named, with the filter as it is without it.
type ChipEntry = {
	key: string
	kind: string
	name: string
	without: DeskFilter
}

function chipsOf(
	filter: DeskFilter,
	projects: readonly HubProject[],
): ChipEntry[] {
	const projectChips = filter.projects.map(id => ({
		key: `project-${id}`,
		kind: 'project',
		name:
			projects.find(project => project.id === id)?.name ??
			'Closed project',
		without: {
			...filter,
			projects: filter.projects.filter(kept => kept !== id),
		},
	}))
	const modeChips = filter.modes.map(mode => ({
		key: `mode-${mode}`,
		kind: 'review',
		name: MODE_NAMES[mode],
		without: {
			...filter,
			modes: filter.modes.filter(kept => kept !== mode),
		},
	}))
	return [...projectChips, ...modeChips]
}

// The filters in force, as chips under the head: each one removes itself; Clear removes all.
export function FilterChips({
	filter,
	projects,
	onFilter,
}: {
	filter: DeskFilter
	projects: readonly HubProject[]
	onFilter: (filter: DeskFilter) => void
}): ReactElement | null {
	if (!isFiltered(filter)) return null
	return (
		<div
			{...stylex.props(chips.bar)}
			role="group"
			aria-label="Filters in force"
		>
			{chipsOf(filter, projects).map(chip => (
				<Chip
					key={chip.key}
					kind={chip.kind}
					name={chip.name}
					onRemove={() => onFilter(chip.without)}
				/>
			))}
			<button
				type="button"
				onClick={() => onFilter({ projects: [], modes: [] })}
				{...stylex.props(focus.ring, chips.clear)}
			>
				Clear
			</button>
		</div>
	)
}
