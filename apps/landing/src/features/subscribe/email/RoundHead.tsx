import { countLines, SAMPLE_CHANGE } from '@entities/desk/model/sample-round'

import { round } from './round.styles'

import type { ReactElement } from 'react'

// The figure's title bar, then the file the round opens, with the reviewer's verdict on it: accepted.
export function RoundHead({
	title,
	aside,
}: {
	title: string
	aside: string
}): ReactElement {
	return (
		<>
			<tr>
				<td style={round.bar}>
					<span style={round.square} />
					<span style={round.barCaption}>{title}</span>
				</td>
				<td style={{ ...round.bar, ...round.barAside }}>{aside}</td>
			</tr>
			<tr>
				<td style={round.file}>
					{SAMPLE_CHANGE.path}
					<span style={round.stat}>
						+{countLines('added')} −{countLines('removed')}
					</span>
				</td>
				<td style={round.verdicts}>
					<span style={round.rejectBox}>✕</span>
					<span style={round.acceptBox}>✓</span>
				</td>
			</tr>
		</>
	)
}
