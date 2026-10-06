import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { deskStage } from './desk-stage.styles'

import type { ReactElement } from 'react'
import type { StageCopy } from '../stage-copy'

type DeskStageProps = {
	copy: StageCopy
	// How long the desk's current turn has lasted (turn-age.ts), beside the label naming it.
	age: string
	// False while the hub is not answering: whether anything is live is then unknown, so no
	// square pulses.
	isLive: boolean
}

// Where the desk's round stands (entities/hub/stage.ts): a square, a label and how long the
// turn has lasted, then the agent's own last line in quotes or a note of what the label means.
export function DeskStage({ copy, age, isLive }: DeskStageProps): ReactElement {
	const { detail } = copy
	return (
		<div {...stylex.props(deskStage.cell)}>
			<p {...stylex.props(deskStage.line)}>
				<LiveDot
					{...copy.dot}
					live={isLive && copy.dot.live === true}
				/>
				<span
					{...stylex.props(
						deskStage.label,
						deskStage[copy.tone],
						copy.isBadge === true && [
							tag.base,
							tag.accent,
							deskStage.badge,
						],
					)}
				>
					{copy.label}
				</span>
				<span {...stylex.props(deskStage.ago)}>{` · ${age}`}</span>
			</p>
			<p
				{...stylex.props(
					deskStage.detail,
					detail.kind === 'words' && deskStage.words,
				)}
			>
				{detail.kind === 'words' ? <q>{detail.body}</q> : detail.text}
			</p>
		</div>
	)
}
