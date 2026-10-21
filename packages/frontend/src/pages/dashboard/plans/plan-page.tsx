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
import { readPlan } from './plan-document'
import { PlanHero, scrollToFragment } from './plan-hero'
import { planPage } from './plan-page.styles'
import { PlanFacts, PlanVersions } from './plan-versions'

import type { Plan, PlanDocument } from '@entities/hub/plan-model'
import type { MouseEvent, ReactElement } from 'react'
import type { PlanMarkdown } from '../markdown'

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

// A fragment link in the body (a footnote and its way back) scrolls in place, like a section
// link: left to the browser, it reaches the router's Back/Forward handling.
function followFragment(event: MouseEvent<HTMLElement>): void {
	if (!(event.target instanceof Element)) return
	const href = event.target.closest('a')?.getAttribute('href')
	if (!href?.startsWith('#') || href === '#') return
	event.preventDefault()
	scrollToFragment(href.slice(1))
}

function PlanArticle({
	html,
	older,
	latest,
	onBack,
}: {
	html: string
	older: Older | null
	latest: number
	onBack: () => void
}): ReactElement {
	return (
		<article {...stylex.props(planPage.article)}>
			{older && (
				<OlderNotice older={older} latest={latest} onBack={onBack} />
			)}
			<div
				data-prose="plan"
				onClick={followFragment}
				// The renderer is the trust boundary: no raw HTML, sanitized (plan-document.ts).
				// oxlint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</article>
	)
}

function PlanReading({
	document,
	adopt,
	renderer,
}: {
	document: PlanDocument
	adopt: (plan: Plan) => void
	renderer: Promise<PlanMarkdown | null>
}): ReactElement {
	const { plan } = document
	const latest = latestVersion(plan)?.number ?? 0
	const { older, read } = useOlderVersion(plan.id)
	const markdown = older?.markdown ?? document.markdown
	const engine = use(renderer)
	const revision = useMarkdownRevision()
	const reading = useMemo(
		() => readPlan(engine, markdown, plan.title),
		// The revision is the renderer's: its output changes when it loads or repaints.
		// oxlint-disable-next-line react/exhaustive-deps
		[engine, markdown, plan.title, revision],
	)
	return (
		<>
			<PlanHero plan={plan} sections={reading.sections}>
				<PlanActions
					plan={plan}
					markdown={markdown}
					onChanged={adopt}
				/>
			</PlanHero>
			<div {...stylex.props(planPage.layout)}>
				<PlanArticle
					html={reading.html}
					older={older}
					latest={latest}
					onBack={() => void read(latest, latest)}
				/>
				<aside {...stylex.props(planPage.aside)}>
					<PlanVersions
						plan={plan}
						reading={older?.number ?? latest}
						onRead={version => void read(version, latest)}
					/>
					<PlanFacts plan={plan} />
				</aside>
			</div>
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
