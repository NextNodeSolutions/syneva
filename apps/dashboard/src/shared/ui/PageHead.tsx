import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { pageHead } from './page-head.styles'
import { page } from './page.styles'

import type { ReactElement, ReactNode } from 'react'

type PageHeadProps = {
	title: ReactNode
	eyebrow?: ReactNode
	lede?: ReactNode
	children?: ReactNode
}

export function PageHead({
	title,
	eyebrow,
	lede,
	children,
}: PageHeadProps): ReactElement {
	return (
		<header {...stylex.props(pageHead.head, page.inset)}>
			<div {...stylex.props(pageHead.text)}>
				{eyebrow && (
					<div {...stylex.props(caption.base)}>{eyebrow}</div>
				)}
				<h1 {...stylex.props(pageHead.headline)}>{title}</h1>
				{lede && <p {...stylex.props(pageHead.lede)}>{lede}</p>}
			</div>
			{children && (
				<div {...stylex.props(pageHead.aside)}>{children}</div>
			)}
		</header>
	)
}
