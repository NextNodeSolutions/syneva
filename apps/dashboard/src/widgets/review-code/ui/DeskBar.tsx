import { projectPath } from '@entities/project/model/project-path'
import { ChurnCounts } from '@entities/review/ui/ChurnCounts'
import { DraftTag } from '@entities/review/ui/DraftTag'
import { ReviewMeta } from '@entities/review/ui/ReviewMeta'
import { AppLink } from '@shared/router/AppLink'
import { Glyph } from '@shared/ui/Glyph'
import * as stylex from '@stylexjs/stylex'
import { fullName } from '@syneva/contracts/projects'

import { deskBar } from './desk-bar.styles'
import { deskButton } from './desk-button.styles'

import type { ReviewCode } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

type DeskBarProps = {
	code: ReviewCode
	isTreeDrawerOpen: boolean
	onTreeDrawerToggle: () => void
}

export function DeskBar({
	code: { project, review },
	isTreeDrawerOpen,
	onTreeDrawerToggle,
}: DeskBarProps): ReactElement {
	return (
		<header {...stylex.props(deskBar.bar)}>
			<div {...stylex.props(deskBar.identity)}>
				<button
					type="button"
					aria-label="Toggle the file tree"
					aria-expanded={isTreeDrawerOpen}
					onClick={onTreeDrawerToggle}
					{...stylex.props(
						deskButton.quiet,
						deskButton.compact,
						deskBar.treeToggle,
					)}
				>
					<Glyph name="menu" />
				</button>
				<AppLink
					to={projectPath(project)}
					{...stylex.props(deskBar.project)}
				>
					{fullName(project)}
				</AppLink>
				<h1 {...stylex.props(deskBar.title)}>{review.title}</h1>
			</div>
			<div {...stylex.props(deskBar.facts)}>
				<span {...stylex.props(deskBar.meta)}>
					<ReviewMeta review={review} />
				</span>
				{review.isDraft && <DraftTag />}
				<ChurnCounts
					additions={review.churn.additions}
					deletions={review.churn.deletions}
				/>
			</div>
		</header>
	)
}
