import * as stylex from '@stylexjs/stylex'

import { Button } from './button'
import { CrossIcon } from './cross-icon'
import { dialog } from './dialog.styles'
import { LiveDot } from './live-dot'
import { touchTarget } from './touch-target.styles'

import type { ReactElement } from 'react'

// A dialog's head: its caption in the mono register after a petrol square,
// and an icon-only Cancel at the row's end.
export function DialogBar({
	caption,
	onClose,
}: {
	caption: string
	onClose: () => void
}): ReactElement {
	return (
		<div {...stylex.props(dialog.bar)}>
			<span {...stylex.props(dialog.caption)}>
				<LiveDot tone="petrol" css={dialog.captionDot} />
				{caption}
			</span>
			<Button
				tone="quiet"
				size="small"
				square
				css={touchTarget.small}
				aria-label="Cancel"
				onClick={onClose}
			>
				<CrossIcon />
			</Button>
		</div>
	)
}
