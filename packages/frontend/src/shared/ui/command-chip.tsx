import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { commandChip } from './command-chip.styles'
import { CopyGlyph } from './copy-glyph'
import { useCopyCommand } from './use-copy-command'

import type { ReactElement } from 'react'
import type { CopyState } from './use-copy-command'

// The keyboard copy a reader is told to press when the page cannot copy.
const COPY_KEYS = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘C' : 'Ctrl+C'

// What the status line says in each state (a polite live region).
const STATUS_TEXT: Record<CopyState, string> = {
	idle: '',
	copied: 'Copied.',
	manual: `Selected. Press ${COPY_KEYS} to copy.`,
}

type CommandChipProps = {
	command: string
	// The field's accessible name: what the command is for.
	label: string
	onWash?: boolean | undefined
	// Fill the column it sits in, as the commands do in a band's install column.
	block?: boolean | undefined
}

// The site's command box: the command in a read-only field (a click selects
// all of it) and a button that copies it, the outcome said under the box.
export function CommandChip({
	command,
	label,
	onWash,
	block,
}: CommandChipProps): ReactElement {
	const { copyState, fieldRef, copy, release } = useCopyCommand(command)
	const isCopied = copyState === 'copied'
	return (
		<div
			{...stylex.props(
				commandChip.box,
				onWash === true && commandChip.onWash,
				block === true && commandChip.block,
				isCopied && commandChip.copied,
			)}
		>
			<span {...stylex.props(commandChip.prompt)} aria-hidden="true">
				$
			</span>
			<input
				ref={fieldRef}
				{...stylex.props(commandChip.field)}
				value={command}
				readOnly
				aria-label={label}
				spellCheck={false}
				onFocus={event => event.currentTarget.select()}
				onBlur={release}
			/>
			<button
				{...stylex.props(press.control, commandChip.copy, focus.ring)}
				type="button"
				aria-label={`Copy: ${command}`}
				onClick={copy}
			>
				<CopyGlyph isCopied={isCopied} />
			</button>
			<span
				{...stylex.props(
					commandChip.status,
					copyState === 'manual' && commandChip.fallback,
				)}
				role="status"
			>
				{STATUS_TEXT[copyState]}
			</span>
		</div>
	)
}
