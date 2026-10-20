import { Suspense, use, useMemo, useRef, useState } from 'react'

import { fetchPlanVersion } from '@entities/hub/api'
import { latestVersion } from '@entities/hub/plan-model'
import { usePlan } from '@entities/hub/use-plan'
import { useEntrance } from '@shared/lib/use-entrance'
import { TextButton } from '@shared/ui/text-button'
import * as stylex from '@stylexjs/stylex'

import { planMarkdown, useMarkdownRevision } from '../markdown'
import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'

import { PlanActions } from './plan-actions'
import { PlanBody, RawBody } from './plan-body'
import { readPlan } from './plan-document'
import { PlanHero } from './plan-hero'
import { planPage } from './plan-page.styles'
import { PlanMeta } from './plan-versions'

import type { Plan, PlanDocument } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'
import type { PlanMarkdown } from '../markdown'
import type { PlanReading as PlanReadingParts } from './plan-document'

type Older = { number: number; markdown: string }

// An earlier version is read on request and held while the reviewer stays on it; the latest
// is the plan's own, followed from the hub. Only the last choice lands: a slow read the
// reviewer has since moved on from is dropped.
function useOlderVersion(id: string): {
	older: Older | null
	read: (version: number, latest: number) => Promise<void>
} {
	const [older, setOlder] = useState<Older | null>(null)
	const lastAsked = useRef(0)
	const read = async (version: number, latest: number): Promise<void> => {
		lastAsked.current += 1
		const asked = lastAsked.current
		if (version === latest) {
			setOlder(null)
			return
		}
		try {
			const markdown = await fetchPlanVersion(id, version)
			if (asked === lastAsked.current)
				setOlder({ number: version, markdown })
		} catch {
			if (asked === lastAsked.current) setOlder(null)
		}
	}
	return { older, read }
}

function OlderNotice({
	older,
	latest,
	onBack,
}: {
	older: Older
	latest: number
	onBack: () => void
}): ReactElement {
	return (
		<p {...stylex.props(planPage.notice)} role="status">
			{`You are reading version ${String(older.number)} of ${String(latest)}.`}
			<TextButton onClick={onBack}>Back to the latest</TextButton>
		</p>
	)
}

// The renderer is the one PlanPage started loading; null when its chunk did not load.
function useReading(
	renderer: Promise<PlanMarkdown | null>,
	markdown: string,
	title: string,
): PlanReadingParts {
	const engine = use(renderer)
	const revision = useMarkdownRevision()
	return useMemo(
		() => readPlan(engine, markdown, title),
		// The revision is the renderer's: its output changes when it loads or repaints.
		// oxlint-disable-next-line react/exhaustive-deps
		[engine, markdown, title, revision],
	)
}

type PlanReadingProps = {
	document: PlanDocument
	adopt: (plan: Plan) => void
	renderer: Promise<PlanMarkdown | null>
}

function PlanReading({
	document,
	adopt,
	renderer,
}: PlanReadingProps): ReactElement {
	const { plan } = document
	const latest = latestVersion(plan)?.number ?? 0
	const { older, read } = useOlderVersion(plan.id)
	const markdown = older?.markdown ?? document.markdown
	const reading = useReading(renderer, markdown, plan.title)
	const [isRaw, setRaw] = useState(false)
	const notice = older && (
		<OlderNotice
			older={older}
			latest={latest}
			onBack={() => void read(latest, latest)}
		/>
	)
	return (
		<>
			<PlanHero
				plan={plan}
				// The raw file has no section bands to scroll to.
				sections={isRaw ? [] : reading.sections}
				meta={
					<PlanMeta
						plan={plan}
						reading={older?.number ?? latest}
						onRead={version => void read(version, latest)}
					/>
				}
			>
				<PlanActions
					plan={plan}
					markdown={markdown}
					onChanged={adopt}
					raw={{ isRaw, toggle: () => setRaw(was => !was) }}
				/>
			</PlanHero>
			{isRaw ? (
				<RawBody markdown={markdown} notice={notice} />
			) : (
				<PlanBody reading={reading} notice={notice} />
			)}
		</>
	)
}

// One plan from the hub's library, read like an RFC. A plan the hub does not keep says so.
export function PlanPage({ id }: { id: string }): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, id)
	const { view, adopt } = usePlan(id)
	// The renderer loads beside the plan's first read, not after it.
	const [renderer] = useState(planMarkdown)
	const pending = <PageHead title="Plan" isPending />
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			{view.phase === 'read' && (
				<Suspense fallback={pending}>
					<PlanReading
						document={view.document}
						adopt={adopt}
						renderer={renderer}
					/>
				</Suspense>
			)}
			{view.phase === 'loading' && pending}
			{view.phase === 'missing' && (
				<PageHead
					title="Unknown plan"
					lede="The hub keeps no plan with this id. Its library lists every plan it keeps."
				/>
			)}
			{view.phase === 'failed' && (
				<PageHead
					title="Plan"
					lede="The hub did not answer for this plan. It reads again on its own."
				/>
			)}
		</div>
	)
}
