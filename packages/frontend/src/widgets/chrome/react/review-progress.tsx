import { useEffect, useState } from 'react'

import { guideInputs, guideProgress } from '@entities/review/guide/guide'
import { isMotionReduced } from '@shared/lib/motion'
import { useCountUp } from '@shared/lib/use-count-up'
import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'

import { topBar } from './top-bar.styles'

import type { ReactElement } from 'react'

// The top bar's review progress. The *moment* of progress is animated (count-up label,
// pulse strip), which is rAF work on top of the store-version subscription.

// Persistent review-progress chrome: a full-width fill strip along the bottom edge of
// the topbar plus a "% reviewed" label beside the actions.
const COUNT_UP_MS = 450
const FULL_PERCENT = 100

// Tab title carries progress too ("(58%) Syneva - repo"), so it reads from other tabs.
// main.ts names the base title at init; setBaseTitle stamps the prefix.
let baseTitle = document.title
export function setBaseTitle(title: string): void {
	baseTitle = title
}

function titleFor(pct: number): string {
	if (pct >= FULL_PERCENT) return `✓ ${baseTitle}`
	if (pct > 0) return `(${pct}%) ${baseTitle}`
	return baseTitle
}

// The animated "% reviewed" pair (strip + label), shown once the desk has files: the label
// counts from the previous % to the new one (useCountUp, ~450ms) instead of jumping, its first
// value showing at once, and the strip pulses when the bar advances. The pulse replays through
// a key bump: a fresh fill element restarts its one-shot animation. Reduced motion jumps the
// label and plays no pulse.
function ProgressPair({ pct }: { pct: number }): ReactElement {
	const labelPct = useCountUp(pct, { durationMs: COUNT_UP_MS })
	const [seenPct, setSeenPct] = useState(pct)
	const [pulses, setPulses] = useState(0)
	if (pct !== seenPct) {
		setSeenPct(pct)
		if (pct > seenPct && !isMotionReduced()) setPulses(pulses + 1)
	}
	return (
		<>
			<span {...stylex.props(topBar.percent)}>{labelPct}% reviewed</span>
			<div {...stylex.props(topBar.progress)}>
				<i
					key={pulses}
					{...stylex.props(
						topBar.progressFill,
						pulses > 0 && topBar.pulse,
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</>
	)
}

export function ReviewProgress(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'fileIndex',
		'preview',
		'overviewOpen',
		'settings',
		'awaitingAgent',
		'queuedReviews',
		'agentActivity',
		'fileView',
		'treeDrawerOpen',
	)
	const hasFiles = Boolean(S.state?.files.length)
	const pct = hasFiles ? guideProgress(guideInputs(S)).pct : 0

	useEffect(() => {
		document.title = hasFiles ? titleFor(pct) : baseTitle
	}, [pct, hasFiles])

	return hasFiles ? <ProgressPair pct={pct} /> : <></>
}
