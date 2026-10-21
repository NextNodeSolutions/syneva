import { lazy, Suspense } from 'react'

import * as stylex from '@stylexjs/stylex'
import { lineKeys } from '@widgets/guide-pane/layout/keys'
import { BlockBoundary } from '@widgets/guide-pane/react/blocks/block-boundary'
import { lines } from '@widgets/guide-pane/react/blocks/diagram-lines'
import { NO_REFS } from '@widgets/guide-pane/react/blocks/diagram-refs'

import { planFigure } from './plan-figure.styles'

import type { DiagramBlock } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { PlanFigure } from './plan-figures'

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

// The figure as sentences: what a screen reader reads, and what a reader without the drawing
// opens. The desk's TextEquivalent reads the same lines but sits in a guide pane's frame and
// carries the domain's chips; a plan's sentences take the page's RFC styling instead.
function Sentences({ block }: { block: DiagramBlock }): ReactElement {
	const sentences = lines(block)
	const keys = lineKeys(sentences)
	return (
		<details {...stylex.props(planFigure.sentences)}>
			<summary {...stylex.props(planFigure.summary)}>As text</summary>
			<ul {...stylex.props(planFigure.sentenceList)}>
				{sentences.map((sentence, index) => (
					<li key={keys[index]}>{sentence.text}</li>
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
