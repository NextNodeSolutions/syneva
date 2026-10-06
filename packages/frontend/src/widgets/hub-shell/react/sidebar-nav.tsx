import { AppLink } from '@shared/ui/app-link'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { sidebar } from './hub-sidebar.styles'
import { navEntry } from './nav-entry.styles'
import { railTip } from './rail-tip.styles'
import { ShellIcon } from './shell-icon'

import type { ReactElement } from 'react'
import type { NavCounts, NavEntry, NavId } from '../nav'

type SidebarNavProps = {
	entries: readonly NavEntry[]
	current: NavId | null
	// Null before the hub's first listing: no count is shown rather than a zero.
	counts: NavCounts | null
	isFolded: boolean
}

function EntryCount({
	entry,
	counts,
	isFolded,
}: {
	entry: NavEntry
	counts: NavCounts | null
	isFolded: boolean
}): ReactElement | null {
	if (!entry.count || !counts) return null
	const count = counts[entry.count]
	const isYours = entry.count === 'yours'
	if (isYours && !count) return null
	if (isFolded && !isYours) return null
	if (isFolded)
		return (
			<span {...stylex.props(navEntry.badge)} aria-hidden="true">
				{count}
			</span>
		)
	return (
		<span
			{...stylex.props(navEntry.count, isYours && navEntry.countYours)}
			aria-label={isYours ? `${count} waiting on you` : undefined}
		>
			{count}
		</span>
	)
}

// One list of the sidebar's entries. Folded, an entry keeps its label in the DOM (its
// accessible name) and shows it as a tip beside the rail on hover and keyboard focus.
export function SidebarNav({
	entries,
	current,
	counts,
	isFolded,
}: SidebarNavProps): ReactElement {
	return (
		<ul {...stylex.props(sidebar.section)}>
			{entries.map(entry => {
				const isCurrent = entry.id === current
				return (
					<li key={entry.id} data-enter="slide">
						<AppLink
							href={entry.href}
							aria-current={isCurrent ? 'page' : undefined}
							data-tip={isFolded ? entry.label : undefined}
							css={[
								focus.inset,
								navEntry.link,
								isCurrent && navEntry.current,
								isFolded && railTip.host,
							]}
						>
							<ShellIcon
								name={entry.icon}
								css={[
									navEntry.icon,
									isCurrent && navEntry.iconCurrent,
								]}
							/>
							<span
								{...stylex.props(
									sidebar.label,
									isFolded && sidebar.labelFolded,
								)}
							>
								{entry.label}
							</span>
							<EntryCount
								entry={entry}
								counts={counts}
								isFolded={isFolded}
							/>
						</AppLink>
					</li>
				)
			})}
		</ul>
	)
}
