import { CommandChip } from '@shared/ui/command-chip'
import * as stylex from '@stylexjs/stylex'

import { emptyHub } from './empty-hub.styles'

import type { ReactElement } from 'react'

// The other ways in, as the CLI spells them.
const VARIANTS = [
	{ command: 'syneva open --diff staged', means: 'Only what is staged.' },
	{
		command: 'syneva open pr <ref>',
		means: 'A branch, PR number or GitHub URL.',
	},
	{ command: 'syneva open file <path>', means: 'One file, tracked or not.' },
] as const

// The command that opens a desk, ready to copy, and its variants as the site's spec rows.
export function OpenCommands(): ReactElement {
	return (
		<div {...stylex.props(emptyHub.install)}>
			<p {...stylex.props(emptyHub.label)}>Inside your repository</p>
			<CommandChip
				command="syneva open"
				label="Command to open a desk"
				onWash
				block
			/>
			<ul {...stylex.props(emptyHub.spec)}>
				{VARIANTS.map(variant => (
					<li
						key={variant.command}
						{...stylex.props(emptyHub.specRow)}
					>
						<span {...stylex.props(emptyHub.specKey)}>
							{variant.command}
						</span>
						<span>{variant.means}</span>
					</li>
				))}
			</ul>
		</div>
	)
}
