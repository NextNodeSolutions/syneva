import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cx } from '@shared/lib/cx'
import * as stylex from '@stylexjs/stylex'
import {
	Background,
	BackgroundVariant,
	ReactFlow,
	useReactFlow,
	useStore,
} from '@xyflow/react'

import { layoutCanvas } from '../layout/canvas-layout'

import { canvas } from './canvas.styles'
import { ContainerNode, ElementNode } from './element-node'
import { flowElements } from './flow-elements'
import { LinkEdge } from './link-edge'
import { useFieldSize } from './use-field-size'

import type { OnSelectionChangeParams, ReactFlowState } from '@xyflow/react'
import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'

const GRID = 24
const FIT = { padding: 0.06, maxZoom: 1 }

// Nothing moves or wires: the drawing is ELK's. Drag pans, a pinch or Ctrl and the wheel zoom, the wheel alone keeps scrolling the overview.
const FLOW = {
	nodeTypes: { element: ElementNode, container: ContainerNode },
	edgeTypes: { link: LinkEdge },
	fitView: true,
	fitViewOptions: FIT,
	minZoom: 0.2,
	maxZoom: 2,
	nodesDraggable: false,
	nodesConnectable: false,
	edgesFocusable: false,
	elevateNodesOnSelect: false,
	// Every link under every node, in the nodes' own order (a parent before what it holds): a link crossing into a container passes behind its head band, never over its name.
	zIndexMode: 'manual',
	zoomOnScroll: false,
	zoomOnDoubleClick: false,
	preventScrolling: false,
	deleteKeyCode: null,
	selectionKeyCode: null,
	multiSelectionKeyCode: null,
} as const

const paneHeight = (state: ReactFlowState): number => state.height

// React Flow fits the drawing once, on its first measure: a field that grows or shrinks with the window fits it again.
function RefitOnResize(): null {
	const height = useStore(paneHeight)
	const { fitView } = useReactFlow()
	useEffect(() => {
		if (height > 0) void fitView(FIT)
	}, [fitView, height])
	return null
}

// One laid-out scene in React Flow, which owns the viewport; selecting a part (pointer, or Tab then Enter) is the one thing it changes, and that goes up to the canvas.
export function CanvasField({
	scene,
	selected,
	onSelect,
}: {
	scene: Scene
	// The part already selected in another projection: React Flow starts with it selected.
	selected: string | null
	onSelect: (id: string | null) => void
}): ReactElement {
	const layout = use(layoutCanvas(scene.input))
	const [initial] = useState(selected)
	const fieldRef = useRef<HTMLDivElement | null>(null)
	const { height } = useFieldSize(fieldRef, layout)
	const { nodes, edges } = useMemo(
		() => flowElements(scene, layout, initial),
		[scene, layout, initial],
	)
	const onSelectionChange = useCallback(
		({ nodes: picked }: OnSelectionChangeParams) => {
			onSelect(picked[0]?.id ?? null)
		},
		[onSelect],
	)
	return (
		<div
			ref={fieldRef}
			{...stylex.props(canvas.field, canvas.fieldHeight(height))}
		>
			<ReactFlow
				{...FLOW}
				defaultNodes={nodes}
				defaultEdges={edges}
				onSelectionChange={onSelectionChange}
			>
				<Background
					variant={BackgroundVariant.Lines}
					gap={GRID}
					patternClassName={cx(canvas.gridLine)}
				/>
				<RefitOnResize />
			</ReactFlow>
		</div>
	)
}
