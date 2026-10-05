import { nowIso } from '../../../application/time.js'

// What a desk knows about its own traffic: when it opened and when a request last touched it.
// The hub never reaps a desk on its own (desks live until closed from the dashboard, the tab or
// the CLI - a review the human parked for a day must still be there); the dashboard shows the
// last activity instead, so an abandoned desk is visible rather than silently gone.
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
