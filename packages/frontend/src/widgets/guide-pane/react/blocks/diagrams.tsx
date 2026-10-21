import { FlowDiagram } from './flow-diagram'
import { SequenceDiagram } from './sequence-diagram'
import { StateDiagram } from './state-diagram'

import type { DiagramBlock } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { DiagramRefs } from './diagram-refs'

// The diagrams' own chunk: loaded by the first diagram block on screen, never by a review without one.
// `fit` scales the drawing down to its container rather than letting it overflow (diagram.fit).
export function Diagram({
	refs,
	block,
	fit,
}: {
	refs: DiagramRefs
	block: DiagramBlock
	fit?: boolean | undefined
}): ReactElement {
	if (block.kind === 'state')
		return <StateDiagram refs={refs} block={block} fit={fit} />
	if (block.kind === 'sequence')
		return <SequenceDiagram refs={refs} block={block} fit={fit} />
	return <FlowDiagram refs={refs} block={block} fit={fit} />
}
