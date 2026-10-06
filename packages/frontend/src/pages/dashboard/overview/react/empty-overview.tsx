import { useRef, useState } from 'react'

import { hubPlace } from '@entities/hub/hub-place'
import { useEntrance } from '@shared/lib/use-entrance'
import { useFocusHandoff } from '@shared/lib/use-focus-handoff'
import * as stylex from '@stylexjs/stylex'
import { HUB_MAIN_ID } from '@widgets/hub-shell/react/hub-shell'

import { closedDesks } from '../../closed'
import { headCopy } from '../../head-copy'
import { heroLede } from '../open-copy'
import { resumeOf } from '../resume'

import { EmptyHero } from './empty-hero'
import { emptyOverview } from './empty-overview.styles'
import { ResumeLedger } from './resume-ledger'

import type { DeskClosed } from '@entities/hub/journal'
import type { ReactElement } from 'react'
import type { DashboardState } from '../../use-dashboard'
import type { HeroCopy } from './empty-hero'

// With no desk live, every closed one counts.
const NO_LIVE_IDS: ReadonlySet<string> = new Set()

// What the hero says: the page's statement, the line under it, and whether the hub asks for
// its access key.
function heroCopy(
	dashboard: DashboardState,
	lastClosed: DeskClosed | null,
): HeroCopy {
	const { hub } = dashboard
	return {
		title: headCopy(dashboard.phase, hubPlace()).title,
		...heroLede({
			place: hubPlace(),
			lastClosed,
			now: hub.now,
			isStale: dashboard.listed?.isStale === true,
		}),
		isKeyed: hub.health?.keyRequired === true,
	}
}

// The overview with no desk live, as one centred composition: the review loop at rest, the
// statement and the ways to open a desk, then the desks closed before, by repository, each one
// a Reopen from back. It mounts once the journal's first read has settled (overview-page.tsx),
// so it shows its history from its first frame.
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
	const hasHistory = resume.groups.length > 0
	return (
		<div ref={root} {...stylex.props(emptyOverview.page)}>
			<EmptyHero
				copy={heroCopy(dashboard, resume.last)}
				isAlone={!hasHistory}
				onNewReview={newReview.offer}
			/>
			{hasHistory && (
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
	)
}
