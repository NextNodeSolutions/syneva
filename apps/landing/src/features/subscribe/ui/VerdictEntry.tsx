import * as stylex from '@stylexjs/stylex'
import { caption as captionStyle } from '@syneva/design-system/controls.styles'

import { launchVerdict } from './launch-verdict.styles'

import type { ReactElement, ReactNode } from 'react'

// One checked line of the verdict: what was left, and what it was, in green at the line's end.
export function VerdictEntry({
	caption,
	children,
}: {
	caption: string
	children: ReactNode
}): ReactElement {
	return (
		<div {...stylex.props(launchVerdict.entry)}>
			{children}
			<span
				{...stylex.props(
					captionStyle.base,
					captionStyle.upper,
					launchVerdict.caption,
				)}
			>
				{caption}
			</span>
		</div>
	)
}
