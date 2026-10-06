import { useCallback, useEffect, useState } from 'react'

import { fetchHubPrefs, persistHubPrefs } from '@entities/settings/api'
import { applyAppearance, DEFAULT_SETTINGS } from '@entities/settings/settings'

import type { SavedPrefs } from '@entities/settings/api'
import type { Settings } from '@entities/settings/model'
import type { DiffStyle } from '@shared/diff-renderer/types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export type HubSettings = {
	settings: Settings | null
	// The last read of the hub's settings failed, and none has landed yet: the page offers
	// nothing to change until one does.
	hasReadFailed: boolean
	save: SaveState
	change: (next: Partial<Settings>) => void
}

const DEFAULT_DIFF_STYLE: DiffStyle = 'split'
// How soon a read the hub did not answer is tried again (a hub restarting, a hand-edited file
// fixed in the meantime).
const READ_RETRY_MS = 3000

// The settings file as the hub holds it, folded over the defaults; nothing when the hub does not
// answer. Never the defaults alone: each change writes the whole file back, so defaults taken
// for the saved settings would overwrite every preference the desks set (the diff style, the
// code theme, the editor command).
async function readSettings(): Promise<SavedPrefs | null> {
	try {
		const prefs = await fetchHubPrefs()
		return {
			settings: { ...DEFAULT_SETTINGS, ...prefs.settings },
			diffStyle: prefs.diffStyle ?? DEFAULT_DIFF_STYLE,
		}
	} catch {
		return null
	}
}

// Read the settings until the hub gives them, trying again READ_RETRY_MS after each failed
// read. Returns the teardown.
function readUntilAnswered(
	onRead: (prefs: SavedPrefs | null) => void,
): () => void {
	let isCurrent = true
	let retry: ReturnType<typeof setTimeout> | undefined
	const load = async (): Promise<void> => {
		const read = await readSettings()
		if (!isCurrent) return
		onRead(read)
		if (read === null) retry = setTimeout(() => void load(), READ_RETRY_MS)
	}
	void load()
	return (): void => {
		isCurrent = false
		clearTimeout(retry)
	}
}

async function saveSettings(
	prefs: SavedPrefs,
	report: (state: SaveState) => void,
): Promise<void> {
	report('saving')
	try {
		await persistHubPrefs(prefs)
		report('saved')
	} catch {
		report('failed')
	}
}

// The reviewer's preferences, read from the hub (the same ~/.syneva/settings.json every desk
// reads) and written back on each change: the page applies a change at once, then says whether
// the hub kept it.
export function useHubSettings(): HubSettings {
	const [settings, setSettings] = useState<Settings | null>(null)
	const [diffStyle, setDiffStyle] = useState<DiffStyle>(DEFAULT_DIFF_STYLE)
	const [hasReadFailed, setHasReadFailed] = useState(false)
	const [save, setSave] = useState<SaveState>('idle')
	// oxlint-disable-next-line nextnode/no-use-effect -- reads the hub's settings file over HTTP until it answers
	useEffect(
		() =>
			readUntilAnswered(read => {
				setHasReadFailed(read === null)
				if (!read) return
				setSettings(read.settings)
				setDiffStyle(read.diffStyle)
			}),
		[],
	)
	const change = useCallback(
		(next: Partial<Settings>) => {
			if (!settings) return
			const merged = { ...settings, ...next }
			setSettings(merged)
			applyAppearance(merged)
			void saveSettings({ settings: merged, diffStyle }, setSave)
		},
		[settings, diffStyle],
	)
	return { settings, hasReadFailed, save, change }
}
