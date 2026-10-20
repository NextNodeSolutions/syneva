import { lazy, Suspense } from 'react'

import * as stylex from '@stylexjs/stylex'
import { BlockBoundary } from '@widgets/guide-pane/react/blocks/block-boundary'
import { lines } from '@widgets/guide-pane/react/blocks/diagram-lines'
import { NO_REFS } from '@widgets/guide-pane/react/blocks/diagram-refs'

import { planFigure } from './plan-figure.styles'

import type { ReactElement } from 'react'
import type { FigureBlock, PlanFigure } from './plan-figures'

// The guide's renderers, in their own chunk: a plan without a figure never loads them.
const Diagram = lazy(async () => {
	const module = await import('@widgets/guide-pane/react/blocks/diagrams')
	return { default: module.Diagram }
})

const CORNERS = [
	{ name: 'top-left', style: planFigure.topLeft },
	{ name: 'top-right', style: planFigure.topRight },
	{ name: 'bottom-left', style: planFigure.bottomLeft },
	{ name: 'bottom-right', style: planFigure.bottomRight },
]

// A figure that does not read, or could not be drawn, shows its source under a notice naming
// why: the page never waits on it.
function InvalidFigure({
	reason,
	source,
}: {
	reason: string
	source: string
}): ReactElement {
	return (
		<div {...stylex.props(planFigure.invalid)} role="note">
			{`This figure does not read: ${reason}.`}
			<pre {...stylex.props(planFigure.source)}>{source}</pre>
		</div>
	)
}

// Two edges can read alike, so a sentence is keyed by its text and how often it came before.
function sentencesOf(block: FigureBlock): { key: string; text: string }[] {
	const seen = new Map<string, number>()
	return lines(block).map(({ text }) => {
		const count = seen.get(text) ?? 0
		seen.set(text, count + 1)
		return { key: `${text}#${String(count)}`, text }
	})
}

// The figure as sentences: what a screen reader reads, and what a reader without the drawing
// opens.
function Sentences({ block }: { block: FigureBlock }): ReactElement {
	return (
		<details {...stylex.props(planFigure.sentences)}>
			<summary {...stylex.props(planFigure.summary)}>As text</summary>
			<ul {...stylex.props(planFigure.sentenceList)}>
				{sentencesOf(block).map(sentence => (
					<li key={sentence.key}>{sentence.text}</li>
				))}
			</ul>
		</details>
	)
}

export function PlanFigureView({
	figure,
}: {
	figure: PlanFigure
}): ReactElement {
	if (!figure.ok)
		return <InvalidFigure reason={figure.reason} source={figure.source} />
	const { block } = figure
	const unDrawn = (
		<InvalidFigure reason="it could not be drawn" source={figure.source} />
	)
	return (
		<figure {...stylex.props(planFigure.root)}>
			<div {...stylex.props(planFigure.field)}>
				{CORNERS.map(corner => (
					<span
						key={corner.name}
						aria-hidden="true"
						{...stylex.props(planFigure.mark, corner.style)}
					/>
				))}
				<div {...stylex.props(planFigure.drawing)}>
					<BlockBoundary fallback={unDrawn}>
						<Suspense fallback={null}>
							<Diagram refs={NO_REFS} block={block} />
						</Suspense>
					</BlockBoundary>
				</div>
			</div>
			{(Boolean(block.title) || Boolean(block.detail)) && (
				<figcaption {...stylex.props(planFigure.caption)}>
					{block.title && (
						<span {...stylex.props(planFigure.captionTitle)}>
							{block.title}
						</span>
					)}
					{block.title && block.detail && ' · '}
					{block.detail}
				</figcaption>
			)}
			<Sentences block={block} />
		</figure>
	)
}
