import { Icon } from '@shared/ui/icon'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'

import { glyph, row } from './sidebar.styles'
import { Chevron, indentStyle, MovedFrom } from './tree-parts'

import type { WalkRow } from '@entities/review/guide/walkthrough'
import type { ReactElement } from 'react'

// The walkthrough pane rows: category headers (with the two trailing fold groups)
// and per-file rows (status icon leads, +/- flush right). The active highlight comes
// derived from walkRows(), which reads the active path.

// The +/- glyph pair matches the diff's churn indicators; U+2212 is the minus the
// width was tuned against, written as an escape to keep comparisons ASCII-safe.
const REMOVED_GLYPH = '\u2212'

const STATE_ICONS = {
	pending: { id: 'gly-circle', title: 'Pending review', css: glyph.todo },
	approved: { id: 'gly-check', title: 'Approved', css: glyph.approved },
	'changes-requested': {
		id: 'gly-circle-alert',
		title: 'Changes requested',
		css: glyph.changes,
	},
}

function WalkStateIcon({
	state,
}: {
	state: keyof typeof STATE_ICONS
}): ReactElement {
	const icon = STATE_ICONS[state]
	return (
		<Icon id={icon.id} css={[glyph.badge, icon.css]} title={icon.title} />
	)
}

function WalkLineStats({
	added,
	removed,
}: {
	added: number
	removed: number
}): ReactElement {
	return (
		<span {...stylex.props(row.trail)}>
			{added ? <i {...stylex.props(row.added)}>{`+${added}`}</i> : null}
			{removed ? (
				<i
					{...stylex.props(row.removed)}
				>{`${REMOVED_GLYPH}${removed}`}</i>
			) : null}
		</span>
	)
}

function WalkCatNode({
	node,
}: {
	node: Extract<WalkRow, { kind: 'cat' }>
}): ReactElement {
	const { S } = chromeCtx()
	const foldable = node.renamed || node.reviewed
	return (
		<div
			{...stylex.props(row.base, row.category, foldable && row.fold)}
			data-key={node.key}
			onClick={() => {
				if (node.renamed) S.toggleRenamedGroup?.()
				else if (node.reviewed) S.toggleReviewedGroup?.()
				else S.selectFile?.(node.jumpIndex)
			}}
		>
			{foldable && <Chevron open={node.open} />}
			<span {...stylex.props(row.name)} title={node.category}>
				{node.category}
			</span>
			{foldable && (
				<span {...stylex.props(row.count)}>
					{node.total + (node.total === 1 ? ' file' : ' files')}
				</span>
			)}
		</div>
	)
}

function WalkFileNode({
	node,
}: {
	node: Extract<WalkRow, { kind: 'file' }>
}): ReactElement {
	return (
		<div
			{...stylex.props(
				row.base,
				row.changed,
				indentStyle(1),
				node.active && row.active,
			)}
			data-key={node.key}
			onClick={() => chromeCtx().S.selectFile?.(node.fileIndex)}
		>
			{/* File status leads the row (empty circle = to do); ± stay flush right below. */}
			<WalkStateIcon state={node.state} />
			<span {...stylex.props(row.name)} title={node.path}>
				{node.name}
			</span>
			{node.movedFrom && <MovedFrom from={node.movedFrom} />}
			<WalkLineStats added={node.added} removed={node.removed} />
		</div>
	)
}

export function WalkNode({ node }: { node: WalkRow }): ReactElement {
	return node.kind === 'cat' ? (
		<WalkCatNode node={node} />
	) : (
		<WalkFileNode node={node} />
	)
}
