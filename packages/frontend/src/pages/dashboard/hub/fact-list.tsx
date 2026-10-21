import * as stylex from '@stylexjs/stylex'

import { pageSection } from '../react/section.styles'

import type { ReactElement } from 'react'

export type Fact = { key: string; value: string }

// Facts a reviewer can check, as one description list: the hub's health, its stream.
export function FactList({ facts }: { facts: Fact[] }): ReactElement {
	return (
		<dl {...stylex.props(pageSection.facts)}>
			{facts.map(fact => (
				<div key={fact.key} {...stylex.props(pageSection.factRow)}>
					<dt
						{...stylex.props(pageSection.fact, pageSection.factKey)}
					>
						{fact.key}
					</dt>
					<dd
						{...stylex.props(
							pageSection.fact,
							pageSection.factValue,
						)}
					>
						{fact.value}
					</dd>
				</div>
			))}
		</dl>
	)
}
