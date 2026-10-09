import { api, hubApi } from '@shared/api/client'
import {
	assertObject,
	DecodeError,
	optBoolean,
	optEnum,
	optNumber,
	optString,
	requiredBoolean,
} from '@shared/api/decode'
import { API_PATHS, HUB_PATHS } from '@syneva/contracts/routes'

import { isCodeTheme } from './code-themes'

import type { DiffStyle } from '@shared/diff-renderer/types'
import type { Settings } from './model'

type SettingsPut = <K extends keyof Settings>(
	key: K,
	decoded: Settings[K] | undefined,
) => void

function decodeEnumSettings(
	wire: Record<string, unknown>,
	endpoint: string,
	put: SettingsPut,
): void {
	const enums: readonly (readonly [keyof Settings, readonly string[]])[] = [
		['lineDiffType', ['word-alt', 'word', 'char', 'none']],
		['diffIndicators', ['bars', 'classic', 'none']],
		[
			'hunkSeparators',
			['line-info', 'simple', 'metadata', 'line-info-basic'],
		],
		['overflow', ['scroll', 'wrap']],
		['lineHighlight', ['full', 'subtle', 'off']],
		['appearance', ['dark', 'light']],
		['unchangedLines', ['collapse', 'expand']],
		['progressBy', ['lines', 'files']],
		['sidebarDefault', ['tree', 'walkthrough']],
		['markdownView', ['auto', 'rendered', 'source']],
	]
	for (const [key, allowed] of enums)
		put(key, optEnum(wire, key, endpoint, allowed))
}

function decodeScalarSettings(
	wire: Record<string, unknown>,
	endpoint: string,
	put: SettingsPut,
): void {
	const bools: (keyof Settings)[] = [
		'showUnchanged',
		'hideReviewed',
		'stageOnAccept',
	]
	for (const key of bools) put(key, optBoolean(wire, key, endpoint))
	const numbers: (keyof Settings)[] = ['fontSize', 'tabSize']
	for (const key of numbers) put(key, optNumber(wire, key, endpoint))
	const strings: (keyof Settings)[] = ['font', 'uiFont', 'editorCommand']
	for (const key of strings) put(key, optString(wire, key, endpoint))
	// A theme the picker doesn't offer (a hand-edited file, one a later Syneva dropped) may be one @pierre/diffs can't resolve, which blanks the diff: keep the default instead.
	const theme = optString(wire, 'theme', endpoint)
	put('theme', theme && isCodeTheme(theme) ? theme : undefined)
}

export function decodeSettings(
	raw: unknown,
	endpoint: string,
): Partial<Settings> {
	const wire = assertObject(raw, endpoint, 'settings')
	const out: Partial<Settings> = {}
	// A nullish decoded value writes nothing, so the key stays absent and the caller's {...DEFAULT_SETTINGS, ...settings} keeps the default (an own `undefined` would overwrite it); `?? null` lets legitimate false/0/'' settings land.
	const put: SettingsPut = <K extends keyof Settings>(
		key: K,
		decoded: Settings[K] | undefined,
	): void => {
		const setting = decoded ?? null
		if (setting === null) return
		out[key] = setting
	}
	decodeEnumSettings(wire, endpoint, put)
	decodeScalarSettings(wire, endpoint, put)
	return out
}

export type DisplayPrefs = {
	settings?: Partial<Settings> | undefined
	diffStyle?: DiffStyle | undefined
}

// The preferences body, read from either route (a desk's /settings, the hub's own for the dashboard): both read and write the same ~/.syneva/settings.json.
function decodePrefs(raw: unknown, endpoint: string): DisplayPrefs {
	const o = assertObject(raw, endpoint)
	return {
		settings: o.settings ? decodeSettings(o.settings, endpoint) : undefined,
		diffStyle: optEnum(o, 'diffStyle', endpoint, [
			'split',
			'unified',
		] as const),
	}
}

// Decode the { ok: true } acknowledgement even on a best-effort write: a 2xx body that isn't
// the promised shape fails here, never as raw wire.
function acknowledge(raw: unknown, endpoint: string): void {
	if (!requiredBoolean(assertObject(raw, endpoint), 'ok', endpoint))
		throw new DecodeError('acknowledgement ok is false', endpoint)
}

export type SavedPrefs = { settings: Settings; diffStyle: DiffStyle }

// An unreachable desk falls back to the defaults at the call site.
export const fetchPrefs = async (): Promise<DisplayPrefs> =>
	decodePrefs(await api(API_PATHS.settings), API_PATHS.settings)

// Best-effort: an unreachable desk must not break the settings UI. `keepalive` lets a write
// sent while the page unloads outlive it.
export const persistSettings = async (
	prefs: SavedPrefs,
	{ keepalive = false }: { keepalive?: boolean } = {},
): Promise<void> => {
	try {
		acknowledge(
			await api(API_PATHS.settings, {
				method: 'POST',
				body: JSON.stringify(prefs),
				keepalive,
			}),
			API_PATHS.settings,
		)
	} catch {
		/* best-effort persist: an unreachable desk must not break the settings UI */
	}
}

// The dashboard's read of the same preferences, through the hub's own route (it has no desk).
export const fetchHubPrefs = async (
	signal?: AbortSignal,
): Promise<DisplayPrefs> =>
	decodePrefs(
		await hubApi(HUB_PATHS.settings, { signal: signal ?? null }),
		HUB_PATHS.settings,
	)

// The dashboard's write. Unlike the desk's, it throws: the Settings page says a save failed.
export const persistHubPrefs = async (prefs: SavedPrefs): Promise<void> => {
	acknowledge(
		await hubApi(HUB_PATHS.settings, {
			method: 'POST',
			body: JSON.stringify(prefs),
		}),
		HUB_PATHS.settings,
	)
}
