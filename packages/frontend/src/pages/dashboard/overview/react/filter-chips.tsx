import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { ShellIcon } from '@widgets/hub-shell/react/shell-icon'

import { FILTER_TRIGGER_ID, filterChipId } from '../../focus-targets'
import { useFocusNext } from '../../use-focus-next'
import { isFiltered } from '../display'
import { MODE_NAMES } from '../filter-names'

import { chips } from './filter-chips.styles'

import type { HubProject } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DeskFilter } from '../display'

function Chip({
	chip,
	onRemove,
}: {
	chip: ChipEntry
	onRemove: () => void
}): ReactElement {
	return (
		<button
			type="button"
			id={filterChipId(chip.key)}
			aria-label={`Remove the ${chip.kind} filter ${chip.name}`}
			onClick={onRemove}
			{...stylex.props(focus.ring, chips.chip)}
		>
			<span {...stylex.props(chips.kind)}>{chip.kind}</span>
			{chip.name}
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

// Where focus goes once a chip is gone: the chip after it, the one before it, or the Filter
// trigger when none is left.
function nextFocus(entries: readonly ChipEntry[], index: number): string {
	const neighbour = entries[index + 1] ?? entries[index - 1]
	return neighbour ? filterChipId(neighbour.key) : FILTER_TRIGGER_ID
}

// The filters in force, as chips under the head: each one removes itself; Clear removes all.
// The row is always there, closed to no height while nothing is filtered, so it opens and
// closes in a slide; focus never falls to the page when a chip goes.
export function FilterChips({
	filter,
	projects,
	onFilter,
}: {
	filter: DeskFilter
	projects: readonly HubProject[]
	onFilter: (filter: DeskFilter) => void
}): ReactElement {
	const focusNext = useFocusNext()
	const isShown = isFiltered(filter)
	const entries = chipsOf(filter, projects)
	return (
		<div {...stylex.props(chips.reveal, isShown && chips.revealShown)}>
			<div {...stylex.props(chips.clip)}>
				{isShown && (
					<div
						{...stylex.props(chips.bar)}
						role="group"
						aria-label="Filters in force"
					>
						{entries.map((chip, index) => (
							<Chip
								key={chip.key}
								chip={chip}
								onRemove={() => {
									focusNext(nextFocus(entries, index))
									onFilter(chip.without)
								}}
							/>
						))}
						<button
							type="button"
							onClick={() => {
								focusNext(FILTER_TRIGGER_ID)
								onFilter({ projects: [], modes: [] })
							}}
							{...stylex.props(focus.ring, chips.clear)}
						>
							Clear
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
