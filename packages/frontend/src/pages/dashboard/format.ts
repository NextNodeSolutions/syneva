import type { HubDesk } from '@entities/hub/model'

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const JUST_NOW_SECONDS = 10

// "just now" / "42s ago" / "5m ago" / "3h ago" / "2d ago" - coarse on purpose: the dashboard
// re-renders every poll, and a second-precise clock would flicker without informing.
export function relativeTime(iso: string, now: number): string {
	const elapsedSeconds = Math.max(
		0,
		Math.round((now - Date.parse(iso)) / MS_PER_SECOND),
	)
	if (Number.isNaN(elapsedSeconds)) return ''
	if (elapsedSeconds < JUST_NOW_SECONDS) return 'just now'
	if (elapsedSeconds < SECONDS_PER_MINUTE) return `${elapsedSeconds}s ago`
	const minutes = Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)
	if (minutes < MINUTES_PER_HOUR) return `${minutes}m ago`
	const hours = Math.floor(minutes / MINUTES_PER_HOUR)
	if (hours < HOURS_PER_DAY) return `${hours}h ago`
	return `${Math.floor(hours / HOURS_PER_DAY)}d ago`
}

function lastSegment(path: string | undefined): string {
	return path?.replace(/\/+$/, '').split('/').pop() ?? ''
}

// The desk's source, as the chip in its row: what the reviewer is looking at.
export function modeLabel(desk: HubDesk): string {
	if (desk.mode === 'file') return `File · ${lastSegment(desk.target)}`
	if (desk.mode === 'pr') return `PR · ${desk.target ?? desk.session}`
	return desk.staged ? 'Staged' : 'Working tree'
}

export type AgentState = {
	tone: 'live' | 'queued' | 'idle'
	label: string
}

// One line about the agent: attached and listening, something waiting for it, or nobody there.
export function agentState(desk: HubDesk): AgentState {
	if (desk.agentListening) return { tone: 'live', label: 'agent listening' }
	if (desk.queuedReviews > 0)
		return { tone: 'queued', label: 'review sent, no agent yet' }
	if (desk.queuedQuestions > 0)
		return {
			tone: 'queued',
			label: `${desk.queuedQuestions} question${desk.queuedQuestions === 1 ? '' : 's'} waiting`,
		}
	return { tone: 'idle', label: 'no agent attached' }
}

export function plural(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? '' : 's'}`
}
