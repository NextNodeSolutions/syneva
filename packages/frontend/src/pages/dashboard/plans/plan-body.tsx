import * as stylex from '@stylexjs/stylex'

import { planBody } from './plan-body.styles'
import { PlanFigureView } from './plan-figure'
import { scrollToFragment } from './plan-hero'

import type { MouseEvent, ReactElement, ReactNode } from 'react'
import type { PlanReading, ReadPart, ReadSection } from './plan-document'

// A fragment link in the body (a footnote and its way back) scrolls in place, like a section
// link: left to the browser, it reaches the router's Back/Forward handling.
function followFragment(event: MouseEvent<HTMLElement>): void {
	if (!(event.target instanceof Element)) return
	const href = event.target.closest('a')?.getAttribute('href')
	if (!href?.startsWith('#') || href === '#') return
	event.preventDefault()
	scrollToFragment(href.slice(1))
}

function PartView({ part }: { part: ReadPart }): ReactElement {
	if (part.kind === 'figure')
		return <PlanFigureView figure={part.figure} number={part.number} />
	return (
		<div
			data-prose="plan"
			// The renderer is the trust boundary: no raw HTML, sanitized (plan-document.ts).
			// oxlint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: part.html }}
		/>
	)
}

function Parts({ parts }: { parts: readonly ReadPart[] }): ReactElement {
	return (
		<>
			{parts.map(part => (
				<PartView key={part.key} part={part} />
			))}
		</>
	)
}

// One section as the RFC pages draw it: a band across the page, its number as a mono eyebrow
// over its heading, then its prose and figures.
function SectionBand({ section }: { section: ReadSection }): ReactElement {
	const headingId = `${section.id}-title`
	return (
		<section
			id={section.id}
			aria-labelledby={headingId}
			{...stylex.props(planBody.band)}
		>
			<div {...stylex.props(planBody.inner)}>
				<p {...stylex.props(planBody.eyebrow)}>{section.number}</p>
				<h2
					id={headingId}
					{...stylex.props(planBody.heading)}
					// The heading as rendered, its inline code and links kept (plan-document.ts).
					// oxlint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{ __html: section.html }}
				/>
				<Parts parts={section.parts} />
			</div>
		</section>
	)
}

// The plan's body under its head: what it says before its first section, then each section in
// its band. A notice (reading an earlier version) opens the body.
export function PlanBody({
	reading,
	notice,
}: {
	reading: PlanReading
	notice: ReactNode
}): ReactElement {
	const hasIntro = reading.intro.length > 0
	return (
		// Delegated over every part: a footnote and its way back sit in different sections.
		<article {...stylex.props(planBody.root)} onClick={followFragment}>
			{(hasIntro || notice) && (
				<div {...stylex.props(planBody.band)}>
					<div {...stylex.props(planBody.inner)}>
						{notice}
						<Parts parts={reading.intro} />
					</div>
				</div>
			)}
			{reading.sections.map(section => (
				<SectionBand key={section.id} section={section} />
			))}
		</article>
	)
}

// The plan as the agent wrote it, front matter and fences included: the file the desk reviews,
// read in place without opening the desk. The notice (reading an earlier version) opens it too.
export function RawBody({
	markdown,
	notice,
}: {
	markdown: string
	notice: ReactNode
}): ReactElement {
	return (
		<article {...stylex.props(planBody.root)}>
			<div {...stylex.props(planBody.band)}>
				<div {...stylex.props(planBody.inner)}>
					{notice}
					<pre {...stylex.props(planBody.raw)}>{markdown}</pre>
				</div>
			</div>
		</article>
	)
}
