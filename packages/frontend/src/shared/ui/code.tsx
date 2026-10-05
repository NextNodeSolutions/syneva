import * as stylex from '@stylexjs/stylex'
import { code } from '@syneva/design-system/inline.styles'

import type { ReactElement, ReactNode } from 'react'

// A command or a path quoted in prose. `onPaper` for one set on a wash band,
// where the wash ground would vanish into the band.
export function Code({
	children,
	onPaper,
}: {
	children: ReactNode
	onPaper?: boolean | undefined
}): ReactElement {
	return (
		<code {...stylex.props(code.base, onPaper === true && code.onPaper)}>
			{children}
		</code>
	)
}
