import { orderedDomains } from '@entities/review/guide/domains'
import { guideInputs, guideStale } from '@entities/review/guide/guide'
import {
	domainProgress,
	isDomainDrafted,
	isDomainStale,
	isOverviewDrafted,
	unassignedChanges,
	unassignedFiles,
} from '@entities/review/guide/resolution'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { renderMarkdown } from '@shared/markdown'
import { deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { kbdHtml } from '@shared/ui/kbd-html'
import { riskTagHtml } from '@shared/ui/risk-tag-html'
import { caption, control, tag } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'
import { diffCtx } from '@widgets/diff-view/context'

import { overview } from './overview.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReviewState } from '@entities/review/model'

function domainRow(
	domain: GuideDomain,
	index: number,
	state: ReviewState,
): string {
	const files = new Set(domain.members.map(member => member.path)).size
	const progress = domainProgress(domain, state.changes)
	const count = `${files} ${files === 1 ? 'file' : 'files'} · ${progress.decided}/${progress.total} decided`
	const stale = isDomainStale(state, domain.id)
		? `<span class="${cx(tag.base, tag.amber)}">Stale</span>`
		: ''
	const drafted = isDomainDrafted(state, domain.id)
		? `<span class="${cx(tag.base, tag.neutral)}">Draft</span>`
		: ''
	return `<li class="${cx(overview.domain)}"><button class="${cx(overview.domainButton)}" data-domain="${esc(domain.id)}"><span class="${cx(overview.domainHead)}"><span class="${cx(overview.number)}">${index + 1}</span>${riskTagHtml(domain.risk)}${stale}${drafted}<span class="${cx(overview.domainTitle)}">${esc(domain.title)}</span><span class="${cx(caption.base, overview.domainFiles)}">${count}</span></span><p class="${cx(overview.consequence)}">${esc(domain.consequence)}</p></button></li>`
}

// Changes the guide does not own (after a reload exposed them): pending, never folded into a domain, and named where the reviewer finds them - the Walkthrough groups whole files, so a block in a file a domain already names never reaches Other and is pointed to by its file instead.
function unassignedNote(state: ReviewState): string {
	const changes = unassignedChanges(state)
	const files = unassignedFiles(state).length
	if (!changes.length && !files) return ''
	const paths = [...new Set(changes.map(change => change.path))]
	const parts = [
		changes.length
			? `${changes.length} changed ${changes.length === 1 ? 'block' : 'blocks'} (in ${paths.map(esc).join(', ')})`
			: '',
		files
			? `${files} file ${files === 1 ? 'operation' : 'operations'} (under Other in the Walkthrough)`
			: '',
	].filter(Boolean)
	return `<div class="${cx(overview.unassigned)}">${iconHtml('gly-warn')} ${parts.join(' and ')} not in the guide: still pending.</div>`
}

// While the agent explains the changeset, the guide reads as Syneva drew it: said once, above the domains it concerns.
function draftNote(state: ReviewState): string {
	const domains = state.guideResolution?.drafted?.length ?? 0
	if (!domains && !isOverviewDrafted(state)) return ''
	return `<div class="${cx(overview.drafted)}">Syneva drafted this guide from the code's structure: the domains marked Draft are grouped and named, not explained yet. Your agent's explanations replace them as it posts them.</div>`
}

// The reading order itself: the changeset's intent, then its domains highest risk first - each with the consequence its risk rests on - and Start, which opens the first file of the first domain.
export function renderOverview(): void {
	const { S, requireState } = diffCtx()
	const state = requireState()
	const title = state.target?.trim() ? state.target : 'Review'
	const stale = guideStale(guideInputs(S))
		? `<div class="${cx(overview.stale)}">${iconHtml('gly-warn')} Parts of this guide describe an earlier version of the diff - the stale domains are marked below. Ask your agent for a fresh guide (<code class="${cx(overview.staleCode)}">syneva reload --guide</code>).</div>`
		: ''
	const domains = orderedDomains(state.guide)
	const startClass = cx(
		press.control,
		control.base,
		deskControl.compact,
		control.primary,
	)
	$('diff').innerHTML =
		`<div class="${cx(overview.page)}"><div class="${cx(overview.card)}">
    <h1 class="${cx(overview.title)}">${esc(title)}</h1>
    <div class="${cx(caption.base, overview.sub)}">${esc(state.mode)} · ${esc(state.session)} · ${state.files.length} files · ${domains.length} ${domains.length === 1 ? 'domain' : 'domains'}</div>
    ${stale}
    ${draftNote(state)}
    ${unassignedNote(state)}
    <div class="${cx(overview.intent)}" data-prose="guide">${renderMarkdown(state.guide?.overview ?? '')}</div>
    <div class="${cx(caption.base, caption.upper, overview.label)}">Domains, highest risk first</div>
    <ol class="${cx(overview.domains)}">${domains.map((domain, index) => domainRow(domain, index, state)).join('')}</ol>
    <div class="${cx(overview.actions)}"><button class="${startClass}" id="guideStart">Start review${kbdHtml('↵', kbd.onFill)}</button></div>
  </div></div>`
	const start = $('diff').querySelector<HTMLButtonElement>('#guideStart')
	start?.addEventListener('click', () => S.startGuided?.())
	for (const row of $('diff').querySelectorAll<HTMLButtonElement>(
		'[data-domain]',
	)) {
		const { domain } = row.dataset
		if (domain)
			row.addEventListener('click', () => S.selectDomain?.(domain))
	}
}
