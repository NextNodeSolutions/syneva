import { deskLinkId, NEW_REVIEW_ID } from './focus-targets'

import type { HubDesk } from '@entities/hub/model'

// The rows as a listing displays them: its groups (a turn's, a project's) in order, each
// group's desks in order.
export type ListedGroups = readonly (readonly HubDesk[])[]

// Where focus goes when a desk's row leaves: the next row of its group, else the one before
// it, else the first row of the next group, else New review.
export function focusAfterClose(groups: ListedGroups, deskId: string): string {
	const at = groups.findIndex(group => group.some(desk => desk.id === deskId))
	const group = groups[at]
	if (!group) return NEW_REVIEW_ID
	const index = group.findIndex(desk => desk.id === deskId)
	const neighbour =
		group[index + 1] ?? group[index - 1] ?? groups[at + 1]?.[0]
	return neighbour ? deskLinkId(neighbour.id) : NEW_REVIEW_ID
}
