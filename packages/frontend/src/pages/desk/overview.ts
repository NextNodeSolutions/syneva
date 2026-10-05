import { guideInputs, guideStale } from '@entities/review/guide/guide'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { kbdHtml } from '@shared/ui/kbd-html'
import { kbd } from '@shared/ui/kbd.styles'
import { caption, control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'
import { diffCtx } from '@widgets/diff-view/context'

import { overview } from './overview.styles'

// The Overview page: the guided review's landing card. It takes over #diff until a file is
// selected (see pages/desk/render.ts's renderGuideOverview). No file list - the sidebar
// (tree/walkthrough) already lists every file, so repeating them here was redundant - and no
// agent prose: a grouping is labels and order only.

// Render the landing card into #diff: what this review is, a note when the grouping predates
// the current diff, and Start.
export function renderOverview(): void {
	const { S, requireState } = diffCtx()
	const state = requireState()
	// '' counts as absent: fall back to a plain heading when the desk has no target ref.
	const title = state.target?.trim() ? state.target : 'Review'
	const stale = guideStale(guideInputs(S))
		? `<div class="${cx(overview.stale)}">${iconHtml('gly-warn')} This grouping was made for an earlier version of the diff - regenerate it and reload with <code class="${cx(overview.staleCode)}">--guide</code> to refresh the sections.</div>`
		: ''
	const startClass = cx(
		press.control,
		control.base,
		deskControl.compact,
		control.primary,
	)
	$('diff').innerHTML =
		`<div class="${cx(overview.page)}"><div class="${cx(overview.card)}">
    <h1 class="${cx(overview.title)}">${esc(title)}</h1>
    <div class="${cx(caption.base, overview.sub)}">${esc(state.mode)} · ${esc(state.session)} · ${state.files.length} files</div>
    ${stale}
    <div class="${cx(overview.actions)}"><button class="${startClass}" id="guideStart">Start review${kbdHtml('↵', kbd.onFill)}</button></div>
  </div></div>`
	const start = $('diff').querySelector<HTMLButtonElement>('#guideStart')
	// The landing markup is rebuilt on every render, so this cannot stack listeners.
	start?.addEventListener('click', () => S.startGuided?.())
}
