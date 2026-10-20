import { Suspense, use, useMemo, useRef, useState } from 'react'

import { fetchPlanVersion } from '@entities/hub/api'
import { latestVersion } from '@entities/hub/plan-model'
import { usePlan } from '@entities/hub/use-plan'
import { useEntrance } from '@shared/lib/use-entrance'
import { loadMarkdown, renderPlanMarkdown } from '@shared/markdown'
import { useMarkdownRevision } from '@shared/markdown/use-markdown-revision'
import { Notice } from '@shared/ui/notice'
import { TextButton } from '@shared/ui/text-button'
import * as stylex from '@stylexjs/stylex'

import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'

import { PlanActions } from './plan-actions'
import { PlanBody, RawBody } from './plan-body'
import { readPlan } from './plan-document'
import { preloadDiagram } from './plan-figure'
import { hasFigures } from './plan-figures'
import { PlanHero } from './plan-hero'
import { planPage } from './plan-page.styles'
import { PlanFacts, PlanVersions } from './plan-versions'

import type { Plan, PlanDocument } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'
import type { PlanReading as PlanReadingParts } from './plan-document'

type Older = { number: number; markdown: string }

// A posted version never changes, so each is read from the hub once a page life, whichever
// plan page asks again.
const olderVersions = new Map<string, string>()

// An earlier version is read on request and held while the reviewer stays on it; the latest
// is the plan's own, followed from the hub. Only the last choice lands: a slow read the
// reviewer has since moved on from is dropped.
function useOlderVersion(id: string): {
	older: Older | null
	read: (version: number) => Promise<void>
	back: () => void
} {
	const [older, setOlder] = useState<Older | null>(null)
	const lastAsked = useRef(0)
	const back = (): void => {
		lastAsked.current += 1
		setOlder(null)
	}
	const read = async (version: number): Promise<void> => {
		lastAsked.current += 1
		const asked = lastAsked.current
		const key = `${id}@${String(version)}`
		try {
			const markdown =
				olderVersions.get(key) ?? (await fetchPlanVersion(id, version))
			olderVersions.set(key, markdown)
			if (asked === lastAsked.current)
				setOlder({ number: version, markdown })
		} catch {
			if (asked === lastAsked.current) setOlder(null)
		}
	}
	return { older, read, back }
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
		<div {...stylex.props(planPage.notice)}>
			<Notice
				tone="amber"
				rule="amber"
				role="status"
				lead={`You are reading version ${String(older.number)} of ${String(latest)}.`}
			>
				<TextButton onClick={onBack}>Back to the latest</TextButton>
			</Notice>
		</div>
	)
}

// The renderer is the one PlanPage started loading; false when its chunk did not load, and
// the plan then reads as its plain text.
function useReading(
	renderer: Promise<boolean>,
	markdown: string,
	title: string,
): PlanReadingParts {
	const isRendered = use(renderer)
	const revision = useMarkdownRevision()
	return useMemo(
		() => readPlan(isRendered ? renderPlanMarkdown : null, markdown, title),
		// The revision is the renderer's: its output changes when it repaints.
		// oxlint-disable-next-line react/exhaustive-deps
		[isRendered, markdown, title, revision],
	)
}

type PlanReadingProps = {
	document: PlanDocument
	adopt: (plan: Plan) => void
	renderer: Promise<boolean>
}

function PlanReading({
	document,
	adopt,
	renderer,
}: PlanReadingProps): ReactElement {
	const { plan } = document
	const latest = latestVersion(plan)?.number ?? 0
	const { older, read, back } = useOlderVersion(plan.id)
	const markdown = older?.markdown ?? document.markdown
	// Started before the reading waits on the renderer, so the drawing loads beside it: an
	// idempotent preload, the one side effect this render has.
	if (hasFigures(markdown)) void preloadDiagram()
	const reading = useReading(renderer, markdown, plan.title)
	const [isRaw, setRaw] = useState(false)
	const notice = older && (
		<OlderNotice older={older} latest={latest} onBack={back} />
	)
	return (
		<>
			<PlanHero
				plan={plan}
				// The raw file has no section bands to scroll to.
				sections={isRaw ? [] : reading.sections}
				meta={
					<>
						<PlanVersions
							plan={plan}
							reading={older?.number ?? latest}
							onRead={version => {
								if (version === latest) back()
								else void read(version)
							}}
						/>
						<PlanFacts plan={plan} />
					</>
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
	const [renderer] = useState(loadMarkdown)
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
