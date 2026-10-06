import { nowIso } from '../../../application/time.js'

// The hub never reaps a desk on its own (desks live until closed from the dashboard, tab or CLI - a review parked for a day must still be there).
// The dashboard shows last activity instead, so an abandoned desk is visible rather than silently gone.
export type DeskLiveness = {
	readonly openedAt: string
	requestStarted(): void
	requestFinished(): void
	lastActivityAt(): string
}

export function createDeskLiveness(openedAt: string): DeskLiveness {
	let lastActivity = openedAt
	return {
		openedAt,
		requestStarted(): void {
			lastActivity = nowIso()
		},
		requestFinished(): void {
			lastActivity = nowIso()
		},
		lastActivityAt(): string {
			return lastActivity
		},
	}
}
