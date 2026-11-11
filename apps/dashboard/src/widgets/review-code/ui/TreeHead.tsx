import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { treeHead } from './tree-head.styles'

import type { ReactElement, ReactNode } from 'react'

export function TreeHead({ children }: { children: ReactNode }): ReactElement {
	return (
		<div {...stylex.props(treeHead.head)}>
			<h2 {...stylex.props(caption.base, caption.upper, treeHead.title)}>
				Files
			</h2>
			{children}
		</div>
	)
}
