import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'
import { HeadNav } from './head-nav'
import { Section } from './pane-sections'
import { ThreadCard } from './thread-card'

import type { DomainThread } from '@entities/review/domain-threads'
import type { DomainTarget } from '@entities/review/model'
import type { ReactElement } from 'react'

// The pane for a domain the attached guide no longer has, reached from the notes panel: nothing of its explanation survives, but its threads do - the exchange under the title the target was written with, and the reviewer's bookkeeping on it.
export function GoneDomainPane({
	target,
	threads,
}: {
	target: DomainTarget
	threads: DomainThread[]
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<aside
			{...stylex.props(pane.aside)}
			aria-label="Explanation"
			data-guide-pane=""
			data-guide-pane-gone=""
		>
			<header {...stylex.props(pane.head)}>
				<div {...stylex.props(pane.row)}>
					<span {...stylex.props(pane.position)}>Discussion</span>
					<span
						{...stylex.props(tag.base, tag.amber)}
						title="The attached guide no longer has this domain; its threads keep what they were about."
					>
						target gone
					</span>
					<HeadNav canGoBack={S.guideReturn.length > 0} />
				</div>
				<h2 {...stylex.props(pane.title)}>{target.domainTitle}</h2>
				<p {...stylex.props(pane.summary)}>
					The attached guide no longer explains this domain. Its
					discussion stays as it was written; ask your agent for a
					guide that covers it again.
				</p>
			</header>
			<div {...stylex.props(pane.body)} data-guide-pane-body="">
				<Section label="Discussion" count={threads.length}>
					{threads.map(thread => (
						<ThreadCard key={thread.key} thread={thread} />
					))}
				</Section>
			</div>
		</aside>
	)
}
