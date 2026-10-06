import { useCallback, useEffect, useState } from 'react'

import { fetchHubPrefs, persistHubPrefs } from '@entities/settings/api'
import { applyAppearance, DEFAULT_SETTINGS } from '@entities/settings/settings'

import type { Settings } from '@entities/settings/model'
import type { DiffStyle } from '@shared/diff-renderer/types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export type HubSettings = {
	settings: Settings | null
	save: SaveState
	change: (next: Partial<Settings>) => void
}

const DEFAULT_DIFF_STYLE: DiffStyle = 'split'

// The settings file as the hub holds it, folded over the defaults; the defaults alone when
// the hub does not answer.
async function readSettings(): Promise<{
	settings: Settings
	diffStyle: DiffStyle
}> {
	try {
		const prefs = await fetchHubPrefs()
		return {
			settings: { ...DEFAULT_SETTINGS, ...prefs.settings },
			diffStyle: prefs.diffStyle ?? DEFAULT_DIFF_STYLE,
		}
	} catch {
		return {
			settings: { ...DEFAULT_SETTINGS },
			diffStyle: DEFAULT_DIFF_STYLE,
		}
	}
}

async function saveSettings(
	prefs: { settings: Settings; diffStyle: DiffStyle },
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
	const [save, setSave] = useState<SaveState>('idle')
	// oxlint-disable-next-line nextnode/no-use-effect -- reads the hub's settings file over HTTP once
	useEffect(() => {
		let isCurrent = true
		const load = async (): Promise<void> => {
			const read = await readSettings()
			if (!isCurrent) return
			setSettings(read.settings)
			setDiffStyle(read.diffStyle)
		}
		void load()
		return (): void => {
			isCurrent = false
		}
	}, [])
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
	return { settings, save, change }
}
