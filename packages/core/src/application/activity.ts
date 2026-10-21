import { nowIso } from './time.js'

import type { AgentActivity } from '@syneva/contracts/browser'

export const MAX_ACTIVITY_CHARS = 200

export type DeskActivity = {
	set(body: string): void
	clear(): void
	read(): AgentActivity | null
	// When the line `read` answers goes stale on its own (epoch ms), null without one: the one
	// change to a desk's status that no request makes, so a transport that pushes the status reads
	// it again then (core keeps no timer to tell it).
	staleAt(): number | null
}

// Lives only in this process - never on `state` (persistReview serializes it verbatim).
// Staleness is checked on read (no timers), so a crashed agent's last line must not show as live forever; an agent comment clears it.
export function createActivity(ttlMs: number): DeskActivity {
	let line: AgentActivity | null = null
	const read = (): AgentActivity | null => {
		if (line && Date.now() - Date.parse(line.at) > ttlMs) line = null
		return line
	}
	return {
		set(body: string): void {
			line = { body: body.slice(0, MAX_ACTIVITY_CHARS), at: nowIso() }
		},
		clear(): void {
			line = null
		},
		read,
		// The first millisecond `read` drops the line: strictly past the TTL.
		staleAt(): number | null {
			const current = read()
			if (!current) return null
			return Date.parse(current.at) + ttlMs + 1
		},
	}
}
