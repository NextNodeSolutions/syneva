import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'

import { linkText, partsOf } from '../layout/scene'

import { PURPOSES } from './canvas-legend'
import { canvas } from './canvas.styles'
import { ChangeTag } from './change-tag'
import { DomainChips } from './domain-chip'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { PathReading } from './path-reading'
import { reading } from './reading.styles'
import { SceneParts } from './scene-parts'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Scene, SceneLink } from '../layout/scene'
import type { CanvasDomain } from '../model'
import type { DomainActions } from './domain-chip'
import type { CanvasScene } from './use-canvas-scene'
import type { CanvasSteps } from './use-canvas-steps'

function nameOf(scene: Scene, id: string): string {
	return scene.elements.get(id)?.label ?? id
}

function Links({
	scene,
	title,
	links,
	end,
}: {
	scene: Scene
	title: string
	links: readonly SceneLink[]
	end: 'from' | 'to'
}): ReactElement | null {
	if (!links.length) return null
	return (
		<span {...stylex.props(canvas.row)}>
			<span {...stylex.props(canvas.caption)}>{title}</span>
			{links.map(entry => (
				<span key={entry.id}>
					{nameOf(scene, entry[end])}
					{linkText(entry) && (
						<span {...stylex.props(canvas.caption)}>
							{' '}
							({linkText(entry)})
						</span>
					)}
				</span>
			))}
		</span>
	)
}

function ElementDetail({
	scene,
	element,
	domains,
	actions,
}: {
	scene: Scene
	element: ModelElement
	domains: readonly CanvasDomain[]
	actions: DomainActions
}): ReactElement {
	const words = [KIND_WORDS[element.kind], element.technology]
		.filter(Boolean)
		.join(' · ')
	// A container's links are the ones crossing its edge, from or to any part it holds.
	const parts = partsOf(scene, element.id)
	return (
		<>
			<span {...stylex.props(canvas.row)}>
				<KindGlyph kind={element.kind} />
				<h2 {...stylex.props(reading.heading)}>{element.label}</h2>
				<span {...stylex.props(canvas.caption)}>{words}</span>
				<ChangeTag change={element.change} />
			</span>
			{element.description && (
				<p {...stylex.props(canvas.description)}>
					{element.description}
				</p>
			)}
			<DomainChips domains={domains} actions={actions} />
			<Links
				scene={scene}
				title="Sends to"
				links={scene.links.filter(
					entry => parts.has(entry.from) && !parts.has(entry.to),
				)}
				end="to"
			/>
			<Links
				scene={scene}
				title="Receives from"
				links={scene.links.filter(
					entry => parts.has(entry.to) && !parts.has(entry.from),
				)}
				end="from"
			/>
		</>
	)
}

type InspectorProps = {
	current: CanvasScene
	position: CanvasSteps
	domains: readonly CanvasDomain[]
	actions: DomainActions
	domainsOf: (element: ModelElement) => CanvasDomain[]
}

function InspectorBody(props: InspectorProps): ReactElement {
	const { current, position, domains, actions } = props
	const { scene, view, selected } = current
	const element = selected ? scene.elements.get(selected) : undefined
	if (element)
		return (
			<>
				<Button
					size="small"
					css={[deskControl.compact, reading.back]}
					onClick={() => current.onSelect(null)}
				>
					{view ? 'Back to path' : 'All parts'}
				</Button>
				<ElementDetail
					scene={scene}
					element={element}
					domains={props.domainsOf(element)}
					actions={actions}
				/>
			</>
		)
	if (view)
		return (
			<PathReading scene={scene} view={view} position={position}>
				<DomainChips
					domains={domains.filter(domain =>
						view.domains?.includes(domain.id),
					)}
					actions={actions}
				/>
			</PathReading>
		)
	return (
		<>
			<h2 {...stylex.props(reading.heading)}>
				{PURPOSES[current.projection].name}
			</h2>
			<p {...stylex.props(reading.paragraph)}>
				{PURPOSES[current.projection].line}
			</p>
			<SceneParts
				scene={scene}
				projection={current.projection}
				onSelect={current.onSelect}
			/>
		</>
	)
}

export function Inspector(props: InspectorProps): ReactElement {
	return (
		<aside {...stylex.props(reading.aside)} aria-label="Read the drawing">
			<InspectorBody {...props} />
		</aside>
	)
}
