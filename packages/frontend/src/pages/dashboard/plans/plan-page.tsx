import { Suspense, use, useMemo, useRef, useState } from 'react'

import { deskOfPlan, latestVersion } from '@entities/hub/plan-model'
import { usePlan } from '@entities/hub/use-plan'
import { useEntrance } from '@shared/lib/use-entrance'
import { loadMarkdown, renderPlanMarkdown } from '@shared/markdown'
import { useMarkdownRevision } from '@shared/markdown/use-markdown-revision'
import * as stylex from '@stylexjs/stylex'

import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'

import { PlanActions } from './plan-actions'
import { PlanBody, RawBody } from './plan-body'
import { readPlan } from './plan-document'
import { preloadDiagram } from './plan-figure'
import { hasFigures } from './plan-figures'
import { PlanHero } from './plan-hero'
import { OlderNotice, useOlderVersion } from './plan-older'
import { PlanFacts, PlanVersions } from './plan-versions'

import type { HubDesk } from '@entities/hub/model'
import type { Plan, PlanDocument } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'
import type { PlanReading as PlanReadingParts } from './plan-document'

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
	desks: readonly HubDesk[]
	adopt: (plan: Plan) => void
	renderer: Promise<boolean>
}

function PlanReading({
	document,
	desks,
	adopt,
	renderer,
}: PlanReadingProps): ReactElement {
	const { plan } = document
	const latest = latestVersion(plan)?.number ?? 0
	const { older, choose, back } = useOlderVersion(plan.id, latest)
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
							onRead={choose}
						/>
						<PlanFacts plan={plan} />
					</>
				}
			>
				<PlanActions
					plan={plan}
					deskPath={deskOfPlan(plan, desks).path}
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
// `desks` is the hub's listing, ahead of the library on which desk is live (deskOfPlan).
export function PlanPage({
	id,
	desks,
}: {
	id: string
	desks: readonly HubDesk[]
}): ReactElement {
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
						desks={desks}
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
