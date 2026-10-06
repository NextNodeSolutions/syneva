import { Icon } from '@shared/ui/icon'

import { glyph } from './sidebar.styles'

import type { ReactElement } from 'react'

const CHANGES = {
	new: { label: 'Added file', css: glyph.new },
	modified: { label: 'Modified file', css: glyph.modified },
	deleted: { label: 'Deleted file', css: glyph.deleted },
}

export function ChangedIcon({
	changeType,
}: {
	changeType: keyof typeof CHANGES
}): ReactElement {
	const change = CHANGES[changeType]
	return (
		<Icon
			id="gly-file"
			css={[glyph.file, change.css]}
			title={change.label}
		/>
	)
}

const STATE_BADGES = {
	pending: { id: 'gly-dot', title: 'Pending review', css: glyph.pending },
	approved: { id: 'gly-check', title: 'Approved', css: glyph.approved },
	'changes-requested': {
		id: 'gly-flag',
		title: 'Changes requested',
		css: glyph.changes,
	},
}

export function StateBadge({
	state,
}: {
	state: keyof typeof STATE_BADGES
}): ReactElement {
	const badge = STATE_BADGES[state]
	return (
		<Icon
			id={badge.id}
			css={[glyph.badge, badge.css]}
			title={badge.title}
		/>
	)
}
