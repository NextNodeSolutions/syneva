import { createElement, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import { canvasDomains } from './canvas-domains'

import type { ReviewState } from '@entities/review/model'
import type { Root } from 'react-dom/client'
import type { SystemCanvasProps } from './model'

// The overview is painted as HTML on every render pass, so the canvas cannot live in it: it lives in one host of its own, kept across passes and put back into the overview's slot each time, under one React root. This module is the canvas's lazy chunk entry; React Flow and ELK load after it, on the first overview whose guide draws a model.

const Canvas = lazy(async () => {
	const module = await import('./react/system-canvas')
	return { default: module.SystemCanvas }
})

let host: HTMLElement | undefined
let root: Root | undefined
let props: Omit<SystemCanvasProps, 'focusDomain'> | undefined
let focusDomain: string | null = null

function paint(): void {
	if (!root || !props) return
	root.render(
		createElement(
			Suspense,
			{ fallback: null },
			createElement(Canvas, { ...props, focusDomain }),
		),
	)
}

function focus(id: string | null): void {
	if (focusDomain === id) return
	focusDomain = id
	paint()
}

// The overview's domain rows light their parts up while the pointer or the focus is on them.
function bindRows(list: ParentNode): void {
	for (const row of list.querySelectorAll<HTMLElement>('[data-domain]')) {
		const { domain } = row.dataset
		if (!domain) continue
		row.addEventListener('mouseenter', () => focus(domain))
		row.addEventListener('focus', () => focus(domain))
		row.addEventListener('mouseleave', () => focus(null))
		row.addEventListener('blur', () => focus(null))
	}
}

export function placeSystemCanvas(
	slot: HTMLElement,
	state: ReviewState,
	onOpenDomain: (id: string) => void,
): void {
	const model = state.guide?.model
	if (!model || !slot.isConnected) return
	host ??= document.createElement('div')
	root ??= createRoot(host)
	const page = slot.parentElement
	slot.replaceWith(host)
	if (page) bindRows(page)
	props = { model, domains: canvasDomains(state), onOpenDomain }
	paint()
}
