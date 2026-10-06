import * as stylex from '@stylexjs/stylex'

import { pageSection } from './section.styles'

import type { ReactElement, ReactNode } from 'react'

// One section of a settings-like page: its heading and what it is for on the left, its content
// on the right.
export function PageSection({
	title,
	note,
	children,
}: {
	title: string
	note: string
	children: ReactNode
}): ReactElement {
	return (
		<section {...stylex.props(pageSection.section)} data-enter="rise">
			<div>
				<h2 {...stylex.props(pageSection.heading)}>{title}</h2>
				<p {...stylex.props(pageSection.note)}>{note}</p>
			</div>
			<div {...stylex.props(pageSection.content)}>{children}</div>
		</section>
	)
}
