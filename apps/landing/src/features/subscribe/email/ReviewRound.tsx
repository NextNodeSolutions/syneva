import { round } from './round.styles'
import { RoundHead } from './RoundHead'
import { RoundLines } from './RoundLines'
import { RoundThread } from './RoundThread'

import type { ReactElement } from 'react'

// The welcome's centrepiece: what the reader will do once Syneva installs, drawn as the hero's desk draws it, and labelled for what it is.
export function ReviewRound(): ReactElement {
	return (
		<table
			role="presentation"
			cellPadding={0}
			cellSpacing={0}
			style={round.frame}
		>
			<tbody>
				<RoundHead />
				<tr>
					<td colSpan={2}>
						<RoundLines />
					</td>
				</tr>
				<tr>
					<td colSpan={2} style={round.thread}>
						<RoundThread />
					</td>
				</tr>
			</tbody>
		</table>
	)
}
