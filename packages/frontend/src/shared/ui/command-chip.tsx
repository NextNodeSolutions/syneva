import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { commandChip } from './command-chip.styles'
import { CopyGlyph } from './copy-glyph'
import { useCopyCommand } from './use-copy-command'

import type { ReactElement } from 'react'
import type { CopyState } from './use-copy-command'

const COPY_KEYS = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘C' : 'Ctrl+C'

const STATUS_TEXT: Record<CopyState, string> = {
	idle: '',
	copied: 'Copied.',
	manual: `Selected. Press ${COPY_KEYS} to copy.`,
}

type CommandChipProps = {
	command: string
	label: string
	onWash?: boolean | undefined
	block?: boolean | undefined
}

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
