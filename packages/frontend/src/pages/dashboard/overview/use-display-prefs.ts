import { useCallback, useState } from 'react'

import { readStored, writeStored } from '@shared/lib/browser-storage'

import type { Grouping } from './groups'

// How the reviewer likes the overview's lists, remembered on this browser (a per-viewer
// convenience: storage refused only loses the memory): grouped by turn or by repository, the
// idle desks shown or set aside, the journal beside the list or not.
export type DisplayPrefs = {
	grouping: Grouping
	showsIdle: boolean
	showsJournal: boolean
}

export const DEFAULT_PREFS: DisplayPrefs = {
	grouping: 'turn',
	showsIdle: true,
	showsJournal: true,
}

const STORAGE_KEY = 'syneva.hub.display'

function remembered(): DisplayPrefs {
	try {
		const kept: unknown = JSON.parse(readStored(STORAGE_KEY) ?? 'null')
		if (typeof kept !== 'object' || kept === null) return DEFAULT_PREFS
		const grouping = Reflect.get(kept, 'grouping')
		const showsIdle = Reflect.get(kept, 'showsIdle')
		const showsJournal = Reflect.get(kept, 'showsJournal')
		return {
			grouping: grouping === 'project' ? 'project' : 'turn',
			showsIdle: showsIdle !== false,
			showsJournal: showsJournal !== false,
		}
	} catch {
		// A memory this page cannot read back.
		return DEFAULT_PREFS
	}
}

export type DisplayPrefsState = DisplayPrefs & {
	change: (next: Partial<DisplayPrefs>) => void
}

export function useDisplayPrefs(): DisplayPrefsState {
	const [prefs, setPrefs] = useState(remembered)
	const change = useCallback((next: Partial<DisplayPrefs>) => {
		setPrefs(was => {
			const merged = { ...was, ...next }
			writeStored(STORAGE_KEY, JSON.stringify(merged))
			return merged
		})
	}, [])
	return { ...prefs, change }
}
