import { lazy, memo, Suspense, useMemo } from 'react'

import { Notice } from '@shared/ui/notice'
import * as stylex from '@stylexjs/stylex'
import { lineKeys } from '@widgets/guide-pane/layout/keys'
import { BlockBoundary } from '@widgets/guide-pane/react/blocks/block-boundary'
import { lines } from '@widgets/guide-pane/react/blocks/diagram-lines'
import { NO_REFS } from '@widgets/guide-pane/react/blocks/diagram-refs'

import { planFigure } from './plan-figure.styles'
import { parseFigure } from './plan-figures'

import type { DiagramBlock } from '@entities/review/guide/model'
import type * as Diagrams from '@widgets/guide-pane/react/blocks/diagrams'
import type { ReactElement } from 'react'

// The guide's renderers, in their own chunk: a plan without a figure never loads them, and one
// with figures starts loading them with its body (preloadDiagram), not once it is drawn.
let diagrams: Promise<typeof Diagrams> | undefined

function loadDiagrams(): Promise<typeof Diagrams> {
	diagrams ??= import('@widgets/guide-pane/react/blocks/diagrams')
	return diagrams
}

export async function preloadDiagram(): Promise<void> {
	try {
		await loadDiagrams()
	} catch {
		// A failed load surfaces where a figure is drawn (its boundary shows the source).
	}
}

const Diagram = lazy(async () => ({ default: (await loadDiagrams()).Diagram }))

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
		<div {...stylex.props(planFigure.invalid)}>
			<Notice
				tone="amber"
				rule="amber"
				role="note"
				lead={`This figure does not read: ${reason}.`}
			/>
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

// A figure is numbered in the plan's order, as an RFC numbers its figures, so the prose can
// point at one ("figure 2"). Parsed from its source where it is drawn and memoized on it: a
// repaint of the prose around it (a grammar loaded) leaves the drawing as it is.
export const PlanFigureView = memo(function PlanFigureView({
	source,
	number,
}: {
	source: string
	number: number
}): ReactElement {
	const figure = useMemo(() => parseFigure(source, number), [source, number])
	if (!figure.ok)
		return <InvalidFigure reason={figure.reason} source={source} />
	const { block } = figure
	const unDrawn = (
		<InvalidFigure reason="it could not be drawn" source={source} />
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
				<div {...stylex.props(planFigure.drawing)} data-plan-drawing>
					<BlockBoundary fallback={unDrawn}>
						<Suspense fallback={null}>
							<Diagram refs={NO_REFS} block={block} />
						</Suspense>
					</BlockBoundary>
				</div>
			</div>
			<figcaption {...stylex.props(planFigure.caption)}>
				{`Fig. ${String(number)}`}
				{block.title && (
					<>
						{' · '}
						<span {...stylex.props(planFigure.captionTitle)}>
							{block.title}
						</span>
					</>
				)}
				{block.detail && ` · ${block.detail}`}
			</figcaption>
			<Sentences block={block} />
		</figure>
	)
})
