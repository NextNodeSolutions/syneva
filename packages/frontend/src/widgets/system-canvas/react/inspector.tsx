import * as stylex from '@stylexjs/stylex'

import { linkText, partsOf } from '../layout/scene'

import { canvas } from './canvas.styles'
import { ChangeTag } from './change-tag'
import { DomainChips } from './domain-chip'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { link as linkStyles } from './link.styles'

import type {
	ModelElement,
	ModelView,
} from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Scene, SceneLink } from '../layout/scene'
import type { CanvasDomain } from '../model'
import type { DomainActions } from './domain-chip'

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
				<span {...stylex.props(canvas.title)}>{element.label}</span>
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
				title="Calls"
				links={scene.links.filter(
					entry => parts.has(entry.from) && !parts.has(entry.to),
				)}
				end="to"
			/>
			<Links
				scene={scene}
				title="Called by"
				links={scene.links.filter(
					entry => parts.has(entry.to) && !parts.has(entry.from),
				)}
				end="from"
			/>
		</>
	)
}

function ViewSteps({
	scene,
	view,
	domains,
	actions,
}: {
	scene: Scene
	view: ModelView
	domains: readonly CanvasDomain[]
	actions: DomainActions
}): ReactElement {
	return (
		<>
			{view.description && (
				<p {...stylex.props(canvas.description)}>{view.description}</p>
			)}
			<ol {...stylex.props(canvas.steps)}>
				{scene.links.map(step => (
					<li key={step.id} {...stylex.props(canvas.step)}>
						<span {...stylex.props(linkStyles.number)}>
							{step.step}
						</span>
						<span>
							{nameOf(scene, step.from)} →{' '}
							{nameOf(scene, step.to)}: {step.label}
						</span>
						<ChangeTag change={step.change} />
					</li>
				))}
			</ol>
			<DomainChips
				domains={domains.filter(domain =>
					view.domains?.includes(domain.id),
				)}
				actions={actions}
			/>
		</>
	)
}

type InspectorProps = {
	scene: Scene
	view: ModelView | undefined
	selected: string | null
	domains: readonly CanvasDomain[]
	actions: DomainActions
	domainsOf: (element: ModelElement) => CanvasDomain[]
}

function InspectorBody(props: InspectorProps): ReactElement {
	const { scene, view, selected, domains, actions } = props
	const element = selected ? scene.elements.get(selected) : undefined
	if (element)
		return (
			<ElementDetail
				scene={scene}
				element={element}
				domains={props.domainsOf(element)}
				actions={actions}
			/>
		)
	if (view)
		return (
			<ViewSteps
				scene={scene}
				view={view}
				domains={domains}
				actions={actions}
			/>
		)
	return (
		<>
			<p {...stylex.props(canvas.hint)}>
				Select a part to see what it is and the domains that change it;
				point at a domain to light up its parts.
			</p>
			<DomainChips domains={domains} actions={actions} />
		</>
	)
}

// Under the drawing, in words: the selected part (what it is, the domains that change it, what it talks to), else the chosen path's steps, else the domains to point at.
export function Inspector(props: InspectorProps): ReactElement {
	return (
		<div {...stylex.props(canvas.inspector)} aria-live="polite">
			<InspectorBody {...props} />
		</div>
	)
}
