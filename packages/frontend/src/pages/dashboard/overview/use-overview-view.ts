import { useState } from 'react'

import { readStored, writeStored } from '@shared/lib/browser-storage'
import { navigate } from '@shared/lib/router'
import { usePlace } from '@shared/lib/use-place'

import { DEFAULT_LAYOUT, LAYOUTS, readView, viewSearch } from './display'

import type { Layout, OverviewView } from './display'

// The display last picked, remembered on this browser: the URL carries the view, this only
// fills in a URL that names none.
const STORAGE_KEY = 'syneva.hub.layout'

function rememberedLayout(): Layout {
	const kept = readStored(STORAGE_KEY)
	return LAYOUTS.find(layout => layout === kept) ?? DEFAULT_LAYOUT
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
	const change = (next: Partial<OverviewView>): void => {
		if (next.layout) {
			writeStored(STORAGE_KEY, next.layout)
			setRemembered(next.layout)
		}
		navigate(`${place.pathname}${viewSearch({ ...view, ...next })}`, {
			replace: true,
			transition: false,
		})
	}
	return { ...view, change }
}
