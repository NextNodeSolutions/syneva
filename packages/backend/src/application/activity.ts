import { nowIso } from './time.js'

import type { AgentActivity } from '@syneva/contracts/browser'

export const MAX_ACTIVITY_CHARS = 200

export type DeskActivity = {
	set(body: string): void
	clear(): void
	read(): AgentActivity | null
}

// Lives only in this process - never on `state` (persistReview serializes it verbatim).
// Staleness is checked on read (no timers), so a crashed agent's last line must not show as live forever; an agent comment clears it.
export function createActivity(ttlMs: number): DeskActivity {
	let line: AgentActivity | null = null
	return {
		set(body: string): void {
			line = { body: body.slice(0, MAX_ACTIVITY_CHARS), at: nowIso() }
		},
		clear(): void {
			line = null
		},
		read(): AgentActivity | null {
			if (line && Date.now() - Date.parse(line.at) > ttlMs) line = null
			return line
		},
	}
}
