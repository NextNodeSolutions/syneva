import { useId } from 'react'

import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { displayRoot, plural } from '../format'

import { projectSection } from './project-section.styles'

import type { HubProject } from '@entities/hub/model'
import type { ReactElement, ReactNode } from 'react'

// Left-to-right marks: the root is set in a right-to-left box (so it is cut from its start),
// and its leading "~/" and trailing "/" would otherwise move to the other end.
const LTR_MARK = '\u200e'

// One repository on the hub: its head, then its desks (the rows come in as children).
export function ProjectSection({
	project,
	children,
}: {
	project: HubProject
	children: ReactNode
}): ReactElement {
	const nameId = useId()
	return (
		<section
			{...stylex.props(projectSection.root)}
			aria-labelledby={nameId}
		>
			<div {...stylex.props(projectSection.head)}>
				<h2 id={nameId} {...stylex.props(projectSection.name)}>
					{project.name}
				</h2>
				<span
					{...stylex.props(projectSection.path)}
					title={project.root}
				>
					{`${LTR_MARK}${displayRoot(project.root)}${LTR_MARK}`}
				</span>
				<span {...stylex.props(caption.base, projectSection.count)}>
					{plural(project.desks.length, 'desk')}
				</span>
			</div>
			<ul {...stylex.props(projectSection.list)}>{children}</ul>
		</section>
	)
}
