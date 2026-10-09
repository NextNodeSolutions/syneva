import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'
import { RefChip } from '../ref-chip'

import { block as styles } from './block.styles'
import { MarkdownHtml } from './markdown-html'

import type {
	ExplanationBlock,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement, ReactNode } from 'react'

const KIND_LABELS: Record<ExplanationBlock['kind'], string> = {
	prose: 'Prose',
	'before-after': 'Before / after',
	state: 'State',
	sequence: 'Sequence',
	flow: 'Data flow',
}

function BlockRefs({
	domain,
	ids,
}: {
	domain: GuideDomain
	ids: readonly string[]
}): ReactElement | null {
	const references = (domain.references ?? []).filter(reference =>
		ids.includes(reference.id),
	)
	if (!references.length) return null
	return (
		<div {...stylex.props(styles.refs)}>
			<span {...stylex.props(styles.refsLabel)}>Refs</span>
			{references.map(reference => (
				<RefChip
					key={reference.id}
					domain={domain}
					reference={reference}
				/>
			))}
		</div>
	)
}

// Longer reasoning, assumptions and failure cases stay folded until the reviewer opens them; the open state lives in the store so a poll or a reload never folds them back.
function BlockDetail({
	domain,
	block,
}: {
	domain: GuideDomain
	block: ExplanationBlock
}): ReactElement | null {
	const { S } = chromeCtx()
	if (!block.detail) return null
	const key = `${domain.id}:${block.id}`
	const isOpen = S.guideExpanded.has(key)
	return (
		<details
			{...stylex.props(styles.detail)}
			open={isOpen || undefined}
			onToggle={event => {
				if (event.currentTarget.open !== isOpen)
					S.toggleBlockDetail?.(key)
			}}
		>
			<summary {...stylex.props(styles.detailSummary)}>
				{isOpen ? '▾' : '▸'} Reasoning, assumptions, failure cases
			</summary>
			<div {...stylex.props(styles.detailBody)}>
				<MarkdownHtml markdown={block.detail} />
			</div>
		</details>
	)
}

// Every block's frame: its kind in words, its title, the actions a later change attaches (the discussion hooks), the body the kind renders, then its references and its folded detail.
export function BlockFrame({
	domain,
	block,
	children,
	isFailed = false,
	actions,
}: {
	domain: GuideDomain
	block: ExplanationBlock
	children: ReactNode
	isFailed?: boolean
	actions?: ReactNode
}): ReactElement {
	const hasFoot = (block.refs?.length ?? 0) > 0 || !!block.detail
	return (
		<section
			{...stylex.props(styles.card, isFailed && styles.failed)}
			data-block={block.id}
			aria-label={block.title ?? KIND_LABELS[block.kind]}
		>
			<div {...stylex.props(styles.head)}>
				<span {...stylex.props(styles.kind)}>
					{KIND_LABELS[block.kind]}
				</span>
				{block.title && (
					<span {...stylex.props(styles.title)}>{block.title}</span>
				)}
				{actions && (
					<span {...stylex.props(styles.actions)}>{actions}</span>
				)}
			</div>
			{children}
			{isFailed && (
				<div {...stylex.props(styles.failNote)}>
					This diagram could not be drawn; its text and references
					stay, the rest of the desk is unaffected.
				</div>
			)}
			{hasFoot && (
				<div {...stylex.props(styles.foot)}>
					<BlockRefs domain={domain} ids={block.refs ?? []} />
					<BlockDetail domain={domain} block={block} />
				</div>
			)}
		</section>
	)
}
