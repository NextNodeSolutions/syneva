import * as stylex from '@stylexjs/stylex'
import { ruledItem } from '@syneva/design-system/ruled.styles'

import { hubRegister } from './hub-register.styles'

import type { StageCounts } from '@entities/hub/stage'
import type { ReactElement } from 'react'

type Station = {
	index: string
	// "Your " drops on the smallest phones; the rest of the label stays.
	your?: string
	label: string
	count: number
	phrase: string
}

function stations(counts: StageCounts): Station[] {
	return [
		{
			index: '01',
			your: 'Your ',
			label: 'agent',
			count: counts.working,
			phrase: 'working',
		},
		{
			index: '02',
			label: 'You',
			count: counts.yours,
			phrase: counts.yours === 1 ? 'waits on you' : 'wait on you',
		},
		{
			index: '03',
			label: 'Sent',
			count: counts.sent,
			phrase: 'not picked up',
		},
	]
}

// The desks no station counts, said once under the register when there are any.
function alsoOpen(counts: StageCounts): string {
	const parts = [
		counts.idle ? `${counts.idle} with no agent listening` : '',
		counts.empty ? `${counts.empty} waiting for changes` : '',
	].filter(Boolean)
	if (!parts.length) return ''
	return `Also open: ${parts.join(', ')}.`
}

// Where each round stands, as the site's ruled facts: the agent's turn, the reviewer's, and
// what was sent that no agent has picked up. Each station is the legend of a row label.
export function HubRegister({ counts }: { counts: StageCounts }): ReactElement {
	const also = alsoOpen(counts)
	return (
		<div>
			<ol
				{...stylex.props(hubRegister.list)}
				aria-label="Where each round stands"
			>
				{stations(counts).map(station => (
					<li
						key={station.index}
						{...stylex.props(
							ruledItem.base,
							hubRegister.station,
							!station.count && hubRegister.stationZero,
						)}
					>
						<span {...stylex.props(hubRegister.label)}>
							<span {...stylex.props(hubRegister.index)}>
								{station.index}
							</span>
							{station.your && (
								<span {...stylex.props(hubRegister.your)}>
									{station.your}
								</span>
							)}
							{station.label}
						</span>
						<p {...stylex.props(hubRegister.count)}>
							<span
								{...stylex.props(
									hubRegister.number,
									!station.count && hubRegister.numberZero,
								)}
							>
								{station.count}
							</span>
							<span {...stylex.props(hubRegister.phrase)}>
								{station.phrase}
							</span>
						</p>
					</li>
				))}
			</ol>
			{also && <p {...stylex.props(hubRegister.also)}>{also}</p>}
		</div>
	)
}
