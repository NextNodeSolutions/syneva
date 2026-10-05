import { useEffect, useRef, useState } from 'react'

import { guideInputs, guideProgress } from '@entities/review/guide/guide'
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
const EASE_POWER = 3
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

// The count-up animation: the label eases from the previous % to the new one over
// ~450ms (ease-out) instead of jumping, and the strip pulses when the bar advances.
// Extracted from the component so the render stays at one level of abstraction.
function animateCountUp(
	from: number,
	to: number,
	show: (pct: number) => void,
): () => void {
	const start = performance.now()
	let raf = 0
	const tick = (now: number): void => {
		const k = Math.min(1, (now - start) / COUNT_UP_MS)
		const eased = 1 - (1 - k) ** EASE_POWER
		show(Math.round(from + (to - from) * eased))
		if (k < 1) raf = requestAnimationFrame(tick)
	}
	raf = requestAnimationFrame(tick)
	return () => cancelAnimationFrame(raf)
}

// The animated "% reviewed" pair (strip + label). One component owns both. The pulse
// replays through a key bump: a fresh fill element restarts its one-shot animation.
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
	const shownRef = useRef<number | null>(null)
	const [labelPct, setLabelPct] = useState<number>(pct)
	const [pulses, setPulses] = useState(0)

	useEffect(() => {
		document.title = hasFiles ? titleFor(pct) : baseTitle
		if (!hasFiles) return undefined
		const shown = shownRef.current
		if (shown === null || pct === shown) {
			setLabelPct(pct)
			shownRef.current = pct
			return undefined
		}
		if (pct > shown) setPulses(n => n + 1)
		const cancel = animateCountUp(shown, pct, setLabelPct)
		shownRef.current = pct
		return cancel
	}, [pct, hasFiles])

	if (!hasFiles) return <></>
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
