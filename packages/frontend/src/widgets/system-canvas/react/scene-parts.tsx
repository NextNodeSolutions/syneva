import * as stylex from '@stylexjs/stylex'

import { FLOORS, isTier, placeOf } from '../layout/tiers'

import { ChangeTag } from './change-tag'
import { KindGlyph } from './kind-glyph'
import { reading } from './reading.styles'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Projection } from '../model'

type PartGroup = { title: string; parts: ModelElement[] }

function partGroups(scene: Scene, projection: Projection): PartGroup[] {
	const parts = [...scene.elements.values()]
	if (projection === 'iso') {
		const parents = new Set(parts.map(part => part.parent))
		const leaves = parts.filter(part => !parents.has(part.id))
		return [
			...FLOORS.toReversed().map(floor => ({
				title: floor.name,
				parts: leaves.filter(part => placeOf(part) === floor.tier),
			})),
			{
				title: 'People and other systems',
				parts: leaves.filter(part => !isTier(placeOf(part))),
			},
		]
	}
	return [
		{
			title: 'New parts',
			parts: parts.filter(part => part.change === 'added'),
		},
		{
			title: 'Changed parts',
			parts: parts.filter(part => part.change === 'changed'),
		},
		{
			title: 'Removed parts',
			parts: parts.filter(part => part.change === 'removed'),
		},
		{
			title: 'Unchanged context',
			parts: parts.filter(part => !part.change),
		},
	]
}

export function SceneParts({
	scene,
	projection,
	onSelect,
}: {
	scene: Scene
	projection: Projection
	onSelect: (id: string) => void
}): ReactElement {
	return (
		<>
			{partGroups(scene, projection)
				.filter(group => group.parts.length)
				.map(group => (
					<section key={group.title}>
						<h3 {...stylex.props(reading.section)}>
							{group.title}{' '}
							<span {...stylex.props(reading.count)}>
								{group.parts.length}
							</span>
						</h3>
						<ul {...stylex.props(reading.list)}>
							{group.parts.map(part => (
								<li key={part.id}>
									<button
										type="button"
										{...stylex.props(reading.part)}
										onClick={() => onSelect(part.id)}
									>
										<KindGlyph kind={part.kind} />
										<span
											{...stylex.props(reading.partName)}
										>
											{part.label}
										</span>
										<ChangeTag change={part.change} />
									</button>
								</li>
							))}
						</ul>
					</section>
				))}
		</>
	)
}
