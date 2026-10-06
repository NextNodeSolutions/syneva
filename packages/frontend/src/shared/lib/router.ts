import { flushSync } from 'react-dom'

import { isMotionReduced } from './motion'

// The dashboard's in-page navigation over the History API: the hub serves the same page shell
// at every dashboard path (DASHBOARD_PATHS), so each page is a real URL that survives a reload
// or a shared link, and moving between them never reloads the hub's listing. A move runs as a
// view transition where the browser has them (the page under the sidebar crossfades and rises,
// the sidebar holds still), and as a plain swap elsewhere or under reduced motion.

export type Place = { pathname: string; search: string }

const listeners = new Set<() => void>()

// Only the dashboard routes in the page: it is the one page whose shell renders every
// dashboard path. Anywhere else (a desk's rail) a link to the dashboard is a plain navigation.
let isRoutingInPage = false

export function routeInPage(): void {
	isRoutingInPage = true
}

function emit(): void {
	for (const listener of listeners) listener()
}

export function subscribePlace(listener: () => void): () => void {
	listeners.add(listener)
	window.addEventListener('popstate', listener)
	return (): void => {
		listeners.delete(listener)
		window.removeEventListener('popstate', listener)
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
	const go = (): void => {
		if (options.replace === true) window.history.replaceState(null, '', to)
		else window.history.pushState(null, '', to)
		flushSync(emit)
	}
	const canTransition =
		options.transition !== false &&
		typeof document.startViewTransition === 'function' &&
		!isMotionReduced()
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
