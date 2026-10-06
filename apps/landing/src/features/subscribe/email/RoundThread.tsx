import { SAMPLE_CHANGE } from '@entities/desk/model/sample-round'
import { Text } from '@react-email/components'

import { round } from './round.styles'

import type { ReactElement } from 'react'

// The question asked on those lines and the agent's answer, in the same place.
export function RoundThread({
	asker,
	answerer,
}: {
	asker: string
	answerer: string
}): ReactElement {
	const { question, answer } = SAMPLE_CHANGE.thread
	return (
		<table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
			<tbody>
				<tr>
					<td style={round.ask}>
						<Text style={round.who}>{asker}</Text>
						<Text style={round.message}>{question}</Text>
						<Text style={{ ...round.who, ...round.agentWho }}>
							{answerer}
						</Text>
						<Text style={round.message}>{answer}</Text>
					</td>
				</tr>
			</tbody>
		</table>
	)
}
