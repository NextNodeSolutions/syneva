import { cx } from '@shared/lib/cx'
import { diffShadowRoot } from '@shared/lib/diff-dom'
import { $ } from '@shared/lib/dom'

import { rulerTick } from './overview-ruler.styles'
import { D } from './runtime'

const MIN_MARK_HEIGHT_PERCENT = 0.3
const FULL_PERCENT = 100
const SCROLL_TOLERANCE_PX = 1

type RulerSide = 'add' | 'del'
type RulerMark = { side: RulerSide; top: number; bottom: number }

export function clearOverviewRuler(): void {
	cancelAnimationFrame(rulerFrame)
	rulerFrame = 0
	const ruler = $('ovr')
	ruler.hidden = true
	ruler.replaceChildren()
}

function measureSpans(): RulerMark[] {
	const shadow = diffShadowRoot()
	if (!shadow) return []
	const diff = $('diff')
	const diffTop = diff.getBoundingClientRect().top
	const { scrollTop } = diff
	const spans = new Map<string, RulerMark>()
	for (const row of shadow.querySelectorAll<HTMLElement>(
		"[data-line-type^='change-']",
	)) {
		const side: RulerSide = (
			row.getAttribute('data-line-type') ?? ''
		).includes('addition')
			? 'add'
			: 'del'
		const box = row.getBoundingClientRect()
		if (!box.height) continue
		const top = box.top - diffTop + scrollTop
		spans.set(`${side}:${Math.round(top)}`, {
			side,
			top,
			bottom: top + box.height,
		})
	}
	return [...spans.values()]
}

function coalesceMarks(spans: RulerMark[]): RulerMark[] {
	const marks: RulerMark[] = []
	for (const span of spans) {
		const last = marks.at(-1)
		if (
			last &&
			last.side === span.side &&
			span.top - last.bottom <= span.bottom - span.top
		)
			last.bottom = span.bottom
		else marks.push({ ...span })
	}
	return marks
}

function paintRuler(marks: RulerMark[], contentHeight: number): void {
	const ruler = $('ovr')
	for (const mark of marks) {
		const tick = document.createElement('i')
		tick.className = cx(
			rulerTick.base,
			mark.side === 'add' ? rulerTick.add : rulerTick.del,
		)
		tick.style.top = `${(mark.top / contentHeight) * FULL_PERCENT}%`
		const heightPercent =
			((mark.bottom - mark.top) / contentHeight) * FULL_PERCENT
		tick.style.height = `${Math.max(heightPercent, MIN_MARK_HEIGHT_PERCENT)}%`
		ruler.appendChild(tick)
	}
	ruler.hidden = false
}

let rulerFrame = 0

export function scheduleOverviewRuler(): void {
	cancelAnimationFrame(rulerFrame)
	rulerFrame = requestAnimationFrame(renderOverviewRuler)
}

function renderOverviewRuler(): void {
	clearOverviewRuler()
	const diff = $('diff')
	const contentHeight = diff.scrollHeight
	if (contentHeight <= diff.clientHeight + SCROLL_TOLERANCE_PX) return
	const marks = coalesceMarks(D.virtual?.changeSpans() ?? measureSpans())
	if (!marks.length) return
	paintRuler(marks, contentHeight)
}
