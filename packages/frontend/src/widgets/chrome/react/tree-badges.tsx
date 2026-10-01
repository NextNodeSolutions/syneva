import { Icon } from '@shared/ui/icon'

import type { ReactElement } from 'react'

// The tree row's two badges: the change-type file icon (its color is the only per-row signal for
// the kind, so the tooltip names it in words - a verdict must survive without color, DESIGN.md)
// and the file's review-state dot/check/flag.
const CHANGE_LABELS: Record<string, string> = {
	new: 'Added file',
	modified: 'Modified file',
	deleted: 'Deleted file',
}

export function ChangedIcon({
	changeType,
}: {
	changeType: string
}): ReactElement {
	return (
		<Icon
			id="gly-file"
			className={`file ${changeType}`}
			title={CHANGE_LABELS[changeType]}
		/>
	)
}

const STATE_BADGES: Record<string, { id: string; title: string }> = {
	pending: { id: 'gly-dot', title: 'Pending review' },
	approved: { id: 'gly-check', title: 'Approved' },
	'changes-requested': { id: 'gly-flag', title: 'Changes requested' },
}

export function StateBadge({ state }: { state: string }): ReactElement {
	const badge = STATE_BADGES[state]
	if (!badge) return <></>
	return (
		<Icon id={badge.id} className={`badge ${state}`} title={badge.title} />
	)
}
