import { useRef, useState } from 'react'

import { hubPlace } from '@entities/hub/hub-place'
import { useEntrance } from '@shared/lib/use-entrance'
import { useFocusHandoff } from '@shared/lib/use-focus-handoff'
import * as stylex from '@stylexjs/stylex'
import { HUB_MAIN_ID } from '@widgets/hub-shell/react/hub-shell'

import { closedDesks } from '../../closed'
import { emptyLede, headCopy } from '../../head-copy'
import { PageHead } from '../../react/page-head'
import { resumeOf } from '../resume'

import { emptyOverview } from './empty-overview.styles'
import { OpenDesk } from './open-desk'
import { ResumeLedger } from './resume-ledger'

import type { ReactElement } from 'react'
import type { DashboardState } from '../../use-dashboard'

// With no desk live, every closed one counts.
const NO_LIVE_IDS: ReadonlySet<string> = new Set()

// The overview with no desk live: the way to open one, then the desks closed before, by
// repository. It mounts once the journal's first read has settled (overview-page.tsx), so it
// shows its history from its first frame.
export function EmptyOverview({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'empty')
	useFocusHandoff(root, HUB_MAIN_ID)
	const { journal, hub, newReview } = dashboard
	// A desk closed while the page is open lands on the wash, once: a page that mounts again
	// washes only what closes after it.
	const [mountedAfter] = useState(() => journal.events.at(-1)?.seq ?? 0)
	const resume = resumeOf(closedDesks(journal.events, NO_LIVE_IDS))
	return (
		<div ref={root} {...stylex.props(emptyOverview.page)}>
			<PageHead
				title={headCopy(dashboard.phase, hubPlace()).title}
				lede={emptyLede(resume.last, hub.now)}
			/>
			<div {...stylex.props(emptyOverview.body)}>
				<div {...stylex.props(emptyOverview.column)}>
					<OpenDesk
						place={hubPlace()}
						isKeyed={hub.health?.keyRequired === true}
						isStale={dashboard.listed?.isStale === true}
						onNewReview={newReview.offer}
					/>
					{resume.groups.length > 0 && (
						<ResumeLedger
							resume={resume}
							events={journal.events}
							freshAfter={Math.max(
								journal.freshAfter ?? Number.POSITIVE_INFINITY,
								mountedAfter,
							)}
							now={hub.now}
							onNewReviewIn={newReview.offerIn}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
