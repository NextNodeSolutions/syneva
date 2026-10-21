// The machine's own preferences (contracts/settings.ts) set apart from the reviewer's: what the
// web may read of the preferences, and what its write leaves in them.
import { MACHINE_SETTINGS } from '@syneva/contracts/settings'

export type Preferences = Record<string, unknown>

const MACHINE_KEYS: ReadonlySet<string> = new Set(MACHINE_SETTINGS)

// The preferences without the machine's own keys.
export function withoutMachineSettings(preferences: Preferences): Preferences {
	const settings = recordOf(preferences.settings)
	if (!settings) return preferences
	return { ...preferences, settings: reviewerOnly(settings) }
}

// What a write from the web leaves: its body, with every machine key as `current` holds it -
// kept when set, absent when not - never as the body says. A body that is no object carries no
// preference of its own, and the machine's keys survive it too.
export function keepMachineSettings(
	written: unknown,
	current: Preferences,
): Preferences {
	const body = recordOf(written) ?? {}
	const settings = {
		...reviewerOnly(recordOf(body.settings) ?? {}),
		...machineOnly(recordOf(current.settings) ?? {}),
	}
	return { ...body, settings }
}

function reviewerOnly(settings: Preferences): Preferences {
	return Object.fromEntries(
		Object.entries(settings).filter(([key]) => !MACHINE_KEYS.has(key)),
	)
}

function machineOnly(settings: Preferences): Preferences {
	return Object.fromEntries(
		Object.entries(settings).filter(([key]) => MACHINE_KEYS.has(key)),
	)
}

function recordOf(raw: unknown): Preferences | null {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
		return null
	return Object.fromEntries(Object.entries(raw))
}
