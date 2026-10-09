import { FlowDiagram } from './flow-diagram'
import { SequenceDiagram } from './sequence-diagram'
import { StateDiagram } from './state-diagram'

import type {
	ExplanationBlock,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'

type DiagramBlock = Extract<
	ExplanationBlock,
	{ kind: 'state' | 'sequence' | 'flow' }
>

// The diagrams' own chunk: loaded by the first diagram block on screen, never by a review without one.
export function Diagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: DiagramBlock
}): ReactElement {
	if (block.kind === 'state')
		return <StateDiagram domain={domain} block={block} />
	if (block.kind === 'sequence')
		return <SequenceDiagram domain={domain} block={block} />
	return <FlowDiagram domain={domain} block={block} />
}
