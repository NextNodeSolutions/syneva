import { getIconForType, SVGSpriteSheet } from '@pierre/diffs'
import { cx } from '@shared/lib/cx'

import { changeTone, churn } from './change-kind.styles'
import { diffHeader } from './file-header.styles'

import type { ChangeTypes } from '@pierre/diffs'
import type { StaticStyle } from '@shared/lib/cx'

const SVG_NS = 'http://www.w3.org/2000/svg'
const HEADER_ICON_SIZE = 16

// Pierre mounts its icon sprite into each diff's shadow root, so a light-DOM <use> can't reach it: inject the same sprite into the document once so the custom header can reuse Pierre's exact change-type icons.
let isSpriteInjected = false

function ensureSprite(): void {
	if (isSpriteInjected) return
	const holder = document.createElement('div')
	holder.innerHTML = SVGSpriteSheet
	const svg = holder.firstElementChild
	if (svg) document.body.appendChild(svg)
	isSpriteInjected = true
}

const CHANGE_TONES: Record<ChangeTypes | 'file', StaticStyle> = {
	new: changeTone.added,
	change: changeTone.modified,
	deleted: changeTone.deleted,
	'rename-pure': changeTone.renamed,
	'rename-changed': changeTone.renamed,
	file: changeTone.plain,
}

export function changeIcon(type: ChangeTypes | 'file' | undefined): SVGElement {
	ensureSprite()
	const t: ChangeTypes | 'file' = type ?? 'file'
	const svg = document.createElementNS(SVG_NS, 'svg')
	svg.setAttribute('width', String(HEADER_ICON_SIZE))
	svg.setAttribute('height', String(HEADER_ICON_SIZE))
	svg.setAttribute('viewBox', `0 0 ${HEADER_ICON_SIZE} ${HEADER_ICON_SIZE}`)
	// An SVG element's className is not a string: the class goes through its attribute.
	svg.setAttribute('class', cx(diffHeader.icon, CHANGE_TONES[t]))
	svg.setAttribute('data-change-icon', t)
	const use = document.createElementNS(SVG_NS, 'use')
	use.setAttribute('href', `#${getIconForType(t)}`)
	svg.appendChild(use)
	return svg
}

export function churnCounts(
	added: number,
	removed: number,
	size: StaticStyle,
): HTMLElement {
	const counts = document.createElement('span')
	counts.className = cx(churn.counts, size)
	counts.innerHTML = `<span class="${cx(churn.added)}">+${added}</span><span class="${cx(churn.removed)}">-${removed}</span>`
	return counts
}
