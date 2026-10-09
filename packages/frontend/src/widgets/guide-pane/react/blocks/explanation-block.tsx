import { lazy, Suspense, useState } from 'react'

import * as stylex from '@stylexjs/stylex'

import { RefChip } from '../ref-chip'

import { BlockBoundary } from './block-boundary'
import { BlockFrame } from './block-frame'
import { block as styles } from './block.styles'
import { diagram } from './diagram.styles'
import { MarkdownHtml } from './markdown-html'
import { TextEquivalent } from './text-equivalent'

import type {
	BeforeAfterBlock,
	BeforeAfterSide,
	ExplanationBlock,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement, ReactNode } from 'react'

// The diagrams load as one chunk on the first diagram block the reviewer reaches; until then (and should the chunk fail) the block shows its sentences.
const Diagram = lazy(async () => {
	const module = await import('./diagrams')
	return { default: module.Diagram }
})

function Side({
	domain,
	side,
	fallbackLabel,
	tone,
}: {
	domain: GuideDomain
	side: BeforeAfterSide
	fallbackLabel: string
	tone: 'before' | 'after'
}): ReactElement {
	const reference = domain.references?.find(ref => ref.id === side.ref)
	return (
		<div {...stylex.props(styles.side)}>
			<span {...stylex.props(styles.sideLabel, styles[tone])}>
				{side.label ?? fallbackLabel}
			</span>
			<MarkdownHtml markdown={side.markdown} />
			{reference && (
				<div {...stylex.props(styles.sideRef)}>
					<RefChip domain={domain} reference={reference} />
				</div>
			)}
		</div>
	)
}

function BeforeAfter({
	domain,
	block,
}: {
	domain: GuideDomain
	block: BeforeAfterBlock
}): ReactElement {
	return (
		<div {...stylex.props(styles.beforeAfter)}>
			<Side
				domain={domain}
				side={block.before}
				fallbackLabel="Before"
				tone="before"
			/>
			<Side
				domain={domain}
				side={block.after}
				fallbackLabel="After"
				tone="after"
			/>
		</div>
	)
}

type DiagramBlock = Extract<
	ExplanationBlock,
	{ kind: 'state' | 'sequence' | 'flow' }
>

function DiagramBody({
	domain,
	block,
	actions,
}: {
	domain: GuideDomain
	block: DiagramBlock
	actions?: ReactNode
}): ReactElement {
	const [hasFailed, setFailed] = useState(false)
	const text = (
		<TextEquivalent domain={domain} block={block} isOpen={hasFailed} />
	)
	return (
		<BlockFrame
			domain={domain}
			block={block}
			isFailed={hasFailed}
			actions={actions}
		>
			{!hasFailed && (
				<BlockBoundary
					fallback={<FailureFlag onFail={() => setFailed(true)} />}
				>
					<Suspense fallback={null}>
						<div {...stylex.props(diagram.frame)}>
							<Diagram domain={domain} block={block} />
						</div>
					</Suspense>
				</BlockBoundary>
			)}
			{text}
		</BlockFrame>
	)
}

// Rendered in place of a diagram that threw: lifts the failure into the block's state so the text equivalent opens.
function FailureFlag({ onFail }: { onFail: () => void }): ReactElement {
	useState(() => {
		queueMicrotask(onFail)
		return null
	})
	return <></>
}

export function ExplanationBlockView({
	domain,
	block,
	actions,
}: {
	domain: GuideDomain
	block: ExplanationBlock
	actions?: ReactNode
}): ReactElement {
	if (block.kind === 'prose')
		return (
			<BlockFrame domain={domain} block={block} actions={actions}>
				<div {...stylex.props(styles.body)}>
					<MarkdownHtml markdown={block.markdown} />
				</div>
			</BlockFrame>
		)
	if (block.kind === 'before-after')
		return (
			<BlockFrame domain={domain} block={block} actions={actions}>
				<BeforeAfter domain={domain} block={block} />
			</BlockFrame>
		)
	return <DiagramBody domain={domain} block={block} actions={actions} />
}
