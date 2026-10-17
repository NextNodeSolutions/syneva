import { BRICK_KIND_LABELS } from '@entities/review/guide/bricks'
import { changeSpan } from '@entities/review/guide/navigation'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { coverage } from './coverage-list.styles'

import type { Brick } from '@entities/review/guide/bricks'
import type { ChangeState, LineRange } from '@entities/review/model'
import type { ReactElement } from 'react'

const VERDICT = {
	pending: { label: 'Pending', style: tag.neutral },
	accepted: { label: 'Kept', style: tag.green },
	rejected: { label: 'Undone', style: tag.amber },
} as const

// A list's verdict in one tag: every change kept, every change decided with some undone, or how many are still open.
export function Verdict({
	changes,
}: {
	changes: readonly ChangeState[]
}): ReactElement {
	const decided = changes.filter(change => change.status !== 'pending')
	if (decided.length < changes.length)
		return (
			<span {...stylex.props(tag.base, tag.neutral, coverage.verdict)}>
				{decided.length}/{changes.length}
			</span>
		)
	const verdict = changes.some(change => change.status === 'rejected')
		? VERDICT.rejected
		: VERDICT.accepted
	return (
		<span {...stylex.props(tag.base, verdict.style, coverage.verdict)}>
			{verdict.label}
		</span>
	)
}

function rangeLabel(range: LineRange | undefined): string {
	if (!range) return 'none'
	return range.startLine === range.endLine
		? `line ${range.startLine}`
		: `lines ${range.startLine}\u2013${range.endLine}`
}

// What the row says on hover: the brick's kind and name, then where it stands on each side of the diff.
function brickTitle(brick: Brick): string {
	const kind = BRICK_KIND_LABELS[brick.kind]
	const head = kind ? `${kind} ${brick.name}` : brick.name
	if (!brick.symbol) return head
	return `${head} · before: ${rangeLabel(brick.symbol.before)} · after: ${rangeLabel(brick.symbol.after)}`
}

// One brick of a file: its kind and name, how many blocks it holds, its verdict; the click lands on its first block with the code cut to the brick (the brick view).
export function BrickRow({ brick }: { brick: Brick }): ReactElement {
	const { S } = chromeCtx()
	const [first] = brick.changes
	const kind = BRICK_KIND_LABELS[brick.kind]
	return (
		<button
			{...stylex.props(coverage.row, coverage.brick)}
			data-brick={brick.key}
			data-unit={brick.changes.length === 1 ? first?.id : undefined}
			title={brickTitle(brick)}
			onClick={() => first && S.focusBrick?.(changeSpan(first))}
		>
			{kind && <span {...stylex.props(coverage.kind)}>{kind}</span>}
			<span
				{...stylex.props(
					coverage.brickName,
					brick.kind === 'block' && coverage.lines,
				)}
			>
				{brick.name}
			</span>
			{brick.changes.length > 1 && (
				<span {...stylex.props(coverage.lines)}>
					{brick.changes.length} blocks
				</span>
			)}
			<Verdict changes={brick.changes} />
		</button>
	)
}
