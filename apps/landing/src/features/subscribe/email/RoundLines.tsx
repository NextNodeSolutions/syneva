import { SAMPLE_CHANGE } from '@entities/desk/model/sample-round'

import { round } from './round.styles'

import type { SampleLineKind } from '@entities/desk/model/sample-round'
import type { CSSProperties, ReactElement } from 'react'

type LineLook = {
	sign: string
	band: CSSProperties
	ink: CSSProperties
	code: CSSProperties
}

const LOOK: Record<SampleLineKind, LineLook> = {
	context: { sign: '', band: {}, ink: {}, code: {} },
	added: {
		sign: '+',
		band: round.addedBand,
		ink: round.addedInk,
		code: round.addedInk,
	},
	removed: {
		sign: '−',
		band: round.removedBand,
		ink: round.removedInk,
		code: { ...round.removedInk, ...round.struck },
	},
}

// The change's lines on their bands, as in the hero: removed in petrol and struck through, added in green.
export function RoundLines(): ReactElement {
	return (
		<table
			role="presentation"
			cellPadding={0}
			cellSpacing={0}
			style={round.lines}
		>
			<tbody>
				{SAMPLE_CHANGE.lines.map(({ line, kind, code }) => {
					const look = LOOK[kind]
					return (
						<tr key={line}>
							<td style={{ ...round.number, ...look.band }}>
								{line}
							</td>
							<td
								style={{
									...round.sign,
									...look.band,
									...look.ink,
								}}
							>
								{look.sign}
							</td>
							<td
								style={{
									...round.code,
									...look.band,
									...look.code,
								}}
							>
								{code}
							</td>
						</tr>
					)
				})}
			</tbody>
		</table>
	)
}
