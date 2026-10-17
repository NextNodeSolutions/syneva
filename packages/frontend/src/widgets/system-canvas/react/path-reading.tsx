import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { reading } from './reading.styles'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement, ReactNode } from 'react'
import type { Scene } from '../layout/scene'
import type { CanvasSteps } from './use-canvas-steps'

type PathProps = {
	scene: Scene
	view: ModelView
	position: CanvasSteps
	children: ReactNode
}

function StepPositions({
	scene,
	position,
}: Pick<PathProps, 'scene' | 'position'>): ReactElement {
	return (
		<div
			role="group"
			aria-label="Path steps"
			{...stylex.props(reading.stepBar)}
		>
			{scene.links.map((step, index) => (
				<Button
					key={step.id}
					size="small"
					aria-label={`Step ${index + 1}: ${step.label ?? ''}`}
					aria-pressed={index === position.index}
					css={[
						deskControl.compact,
						index === position.index && canvas.tabOn,
					]}
					onClick={() => position.onStep(index)}
				>
					{index + 1}
				</Button>
			))}
		</div>
	)
}

function StepExplanation({
	scene,
	position,
}: Pick<PathProps, 'scene' | 'position'>): ReactElement | null {
	const { step } = position
	if (!step) return null
	return (
		<div aria-live="polite" aria-atomic="true">
			<span {...stylex.props(reading.count)}>
				Step {position.index + 1} of {scene.links.length}
			</span>
			<p {...stylex.props(reading.stepLabel)}>{step.label}</p>
			<dl {...stylex.props(reading.endpoints)}>
				{[step.from, step.to].map(id => {
					const part = scene.elements.get(id)
					return (
						<div key={id}>
							<dt {...stylex.props(reading.endpointName)}>
								{part?.label ?? id}
							</dt>
							{part?.description && (
								<dd {...stylex.props(reading.endpoint)}>
									{part.description}
								</dd>
							)}
						</div>
					)
				})}
			</dl>
		</div>
	)
}

export function PathReading({
	scene,
	view,
	position,
	children,
}: PathProps): ReactElement {
	return (
		<>
			<h2 {...stylex.props(reading.heading)}>{view.title}</h2>
			{view.description && (
				<p {...stylex.props(reading.paragraph)}>{view.description}</p>
			)}
			<StepPositions scene={scene} position={position} />
			<StepExplanation scene={scene} position={position} />
			<div {...stylex.props(reading.navigation)}>
				<Button
					size="small"
					css={deskControl.compact}
					disabled={position.index <= 0}
					onClick={() => position.onStep(position.index - 1)}
				>
					Previous step
				</Button>
				<Button
					size="small"
					css={deskControl.compact}
					disabled={position.index >= scene.links.length - 1}
					onClick={() => position.onStep(position.index + 1)}
				>
					Next step
				</Button>
			</div>
			<h3 {...stylex.props(reading.section)}>Read the explanation</h3>
			{children}
		</>
	)
}
