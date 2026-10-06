import { useCallback, useState } from 'react'

import { navigate } from '@shared/lib/router'
import { usePlace } from '@shared/lib/use-place'

import { DEFAULT_LAYOUT, LAYOUTS, readView, viewSearch } from './display'

import type { Layout, OverviewView } from './display'

const STORAGE_KEY = 'syneva.hub.layout'

function rememberedLayout(): Layout {
	try {
		const kept = window.localStorage.getItem(STORAGE_KEY)
		return LAYOUTS.find(layout => layout === kept) ?? DEFAULT_LAYOUT
	} catch {
		return DEFAULT_LAYOUT
	}
}

function rememberLayout(layout: Layout): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, layout)
	} catch {
		// Storage refused: the URL still carries the view.
	}
}

export type OverviewViewState = OverviewView & {
	change: (next: Partial<OverviewView>) => void
}

// The overview's view, read from the URL and changed through it. A change rewrites the
// current history entry (Back leaves the overview rather than replaying each filter) and swaps
// in place, without the page transition: the page stays, its contents move.
export function useOverviewView(): OverviewViewState {
	const place = usePlace()
	const [remembered, setRemembered] = useState(rememberedLayout)
	const view = readView(place.search, remembered)
	const change = useCallback(
		(next: Partial<OverviewView>) => {
			const merged = { ...view, ...next }
			if (next.layout) {
				rememberLayout(next.layout)
				setRemembered(next.layout)
			}
			navigate(`${place.pathname}${viewSearch(merged)}`, {
				replace: true,
				transition: false,
			})
		},
		[view, place.pathname],
	)
	return { ...view, change }
}
