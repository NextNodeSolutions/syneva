import { guideInputs, guideStale } from '@entities/review/guide/guide'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { kbdHtml } from '@shared/ui/kbd-html'
import { caption, control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'
import { diffCtx } from '@widgets/diff-view/context'

import { overview } from './overview.styles'

export function renderOverview(): void {
	const { S, requireState } = diffCtx()
	const state = requireState()
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
	start?.addEventListener('click', () => S.startGuided?.())
}
