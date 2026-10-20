import * as stylex from '@stylexjs/stylex'

import { lineKeys } from '../../layout/keys'
import { RefChip } from '../ref-chip'

import { lines } from './diagram-lines'
import { diagram } from './diagram.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { DiagramBlock } from './diagram-lines'

export function TextEquivalent({
	domain,
	block,
	isOpen = false,
}: {
	domain: GuideDomain
	block: DiagramBlock
	isOpen?: boolean
}): ReactElement {
	const refs = domain.references ?? []
	const sentences = lines(block)
	const keys = lineKeys(sentences)
	return (
		<details
			{...stylex.props(diagram.textEquivalent)}
			open={isOpen || undefined}
		>
			<summary {...stylex.props(diagram.textSummary)}>As text</summary>
			<ol {...stylex.props(diagram.textList)}>
				{sentences.map((line, index) => {
					const reference = refs.find(ref => ref.id === line.refId)
					return (
						<li key={keys[index]}>
							{line.text}
							{reference && (
								<>
									{' '}
									<RefChip
										domain={domain}
										reference={reference}
									/>
								</>
							)}
						</li>
					)
				})}
			</ol>
		</details>
	)
}
