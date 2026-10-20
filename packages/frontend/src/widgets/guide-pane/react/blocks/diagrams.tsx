import { FlowDiagram } from './flow-diagram'
import { SequenceDiagram } from './sequence-diagram'
import { StateDiagram } from './state-diagram'

import type { ExplanationBlock } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { DiagramRefs } from './diagram-refs'

type DiagramBlock = Extract<
	ExplanationBlock,
	{ kind: 'state' | 'sequence' | 'flow' }
>

// The diagrams' own chunk: loaded by the first diagram block on screen, never by a review without one.
export function Diagram({
	refs,
	block,
}: {
	refs: DiagramRefs
	block: DiagramBlock
}): ReactElement {
	if (block.kind === 'state')
		return <StateDiagram refs={refs} block={block} />
	if (block.kind === 'sequence')
		return <SequenceDiagram refs={refs} block={block} />
	return <FlowDiagram refs={refs} block={block} />
}
