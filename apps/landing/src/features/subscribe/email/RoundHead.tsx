import { changeStat, SAMPLE_CHANGE } from '@entities/desk/model/sample-round'

import { round } from './round.styles'
import { WELCOME_COPY } from './welcome-copy'

import type { ReactElement } from 'react'

// The figure's title bar, then the file the round opens, with the reviewer's verdict on it: accepted.
export function RoundHead(): ReactElement {
	return (
		<>
			<tr>
				<td style={round.bar}>
					<span style={round.square} />
					<span style={round.barCaption}>{WELCOME_COPY.round}</span>
				</td>
				<td style={{ ...round.bar, ...round.barAside }}>
					{WELCOME_COPY.illustrative}
				</td>
			</tr>
			<tr>
				<td style={round.file}>
					{SAMPLE_CHANGE.path}
					<span style={round.stat}>{changeStat()}</span>
				</td>
				<td style={round.verdicts}>
					<span style={round.rejectBox}>✕</span>
					<span style={round.acceptBox}>✓</span>
				</td>
			</tr>
		</>
	)
}
