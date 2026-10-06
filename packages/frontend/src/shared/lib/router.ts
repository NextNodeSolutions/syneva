import { flushSync } from 'react-dom'

import { queries } from '@syneva/design-system/media.stylex'

import { isMotionReduced } from './motion'

// The dashboard's in-page navigation over the History API: the hub serves the same page shell
// at every dashboard path (DASHBOARD_PATHS), so each page is a real URL that survives a reload
// or a shared link, and moving between them never reloads the hub's listing. A move runs as a
// view transition where the browser has them (the old page fades out, the sidebar holds still),
// and as a plain swap elsewhere, under reduced motion and on phones (there the drawer's slide
// is the move's motion, and the page would be painted over it). A new page opens at its top;
// Back and Forward bring a page back where it was left.

export type Place = { pathname: string; search: string }

const listeners = new Set<() => void>()

// Only the dashboard routes in the page: it is the one page whose shell renders every
// dashboard path. Anywhere else (a desk's rail) a link to the dashboard is a plain navigation.
let isRoutingInPage = false

// What the pages scroll in, as the shell names it (the page column; on phones that column does
// not scroll and the document does).
let pageColumn: Element | null = null

export function routeInPage(): void {
	isRoutingInPage = true
	// The page restores its own scroll: the browser's would land before the page it restores
	// has rendered.
	window.history.scrollRestoration = 'manual'
}

export function setPageScroller(element: Element | null): void {
	pageColumn = element
}

function scroller(): Element | null {
	if (!pageColumn) return null
	if (getComputedStyle(pageColumn).overflowY === 'visible')
		return document.scrollingElement
	return pageColumn
}

function scrollTopOf(state: unknown): number {
	if (typeof state !== 'object' || state === null) return 0
	if (!('scrollTop' in state) || typeof state.scrollTop !== 'number') return 0
	return state.scrollTop
}

function emit(): void {
	for (const listener of listeners) listener()
}

// Back or Forward: the page the entry names, then its scroll as it was left.
function onPop(): void {
	flushSync(emit)
	scroller()?.scrollTo({ top: scrollTopOf(window.history.state) })
}

export function subscribePlace(listener: () => void): () => void {
	listeners.add(listener)
	if (listeners.size === 1) window.addEventListener('popstate', onPop)
	return (): void => {
		listeners.delete(listener)
		if (!listeners.size) window.removeEventListener('popstate', onPop)
	}
}

// The current URL's path and query, as one string so a subscriber compares it by value.
export function placeKey(): string {
	return `${window.location.pathname}${window.location.search}`
}

type NavigateOptions = { replace?: boolean; transition?: boolean }

// Go to `to` (a path with an optional query) inside the page. `replace` rewrites the current
// entry (a filter change, which Back should not replay step by step); `transition: false`
// swaps without the view transition (a change inside the same page).
export function navigate(to: string, options: NavigateOptions = {}): void {
	if (to === placeKey()) return
	const isReplace = options.replace === true
	const go = (): void => {
		if (isReplace) window.history.replaceState(window.history.state, '', to)
		else {
			// The entry being left keeps its scroll, for Back.
			const scrollTop = scroller()?.scrollTop ?? 0
			window.history.replaceState({ scrollTop }, '')
			window.history.pushState(null, '', to)
		}
		flushSync(emit)
		if (!isReplace) scroller()?.scrollTo({ top: 0 })
	}
	const canTransition =
		options.transition !== false &&
		typeof document.startViewTransition === 'function' &&
		!isMotionReduced() &&
		!window.matchMedia(queries.stacked).matches
	if (canTransition) document.startViewTransition(go)
	else go()
}

// Whether a click on a link should stay in the page: a plain primary click on a same-origin
// link with no target. A modified click (new tab, new window, download) keeps its native
// behaviour.
export function isInPageClick(
	event: MouseEvent,
	anchor: HTMLAnchorElement,
): boolean {
	const isModified =
		event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
	return (
		isRoutingInPage &&
		event.button === 0 &&
		!isModified &&
		!event.defaultPrevented &&
		anchor.target === '' &&
		anchor.origin === window.location.origin
	)
}
