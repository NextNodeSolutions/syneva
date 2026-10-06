import type { Turn } from '@entities/hub/turn'
import type { DotTone } from '@shared/ui/live-dot'

// What each turn is called where it shows: the circuit's station, the heading of its group,
// the phrase after its count, and its square (live while an agent works; hollow for what was
// sent and waits to be picked up). The same words on every display, so a reviewer who switches
// from the circuit to the board reads the same hub.
export type TurnCopy = {
	station: string
	heading: string
	phrase: (count: number) => string
	note: string
	dot: { tone: DotTone; isHollow: boolean; isLive: boolean }
}

export const TURN_COPY: Record<Turn, TurnCopy> = {
	yours: {
		station: 'You',
		heading: 'Your turn',
		phrase: count => (count === 1 ? 'waits on you' : 'wait on you'),
		note: 'An agent is waiting for your review.',
		dot: { tone: 'petrol', isHollow: false, isLive: false },
	},
	agent: {
		station: 'Your agent',
		heading: 'Agent working',
		phrase: () => 'working',
		note: 'Your agent is acting on the review.',
		dot: { tone: 'signal', isHollow: false, isLive: true },
	},
	sent: {
		station: 'Sent',
		heading: 'Sent',
		phrase: () => 'not picked up',
		note: 'A review or a question waits for an agent to pick it up.',
		dot: { tone: 'petrol', isHollow: true, isLive: false },
	},
	idle: {
		station: 'Idle',
		heading: 'Idle',
		phrase: () => 'no agent attached',
		note: 'No agent attached, or no changes yet. Review any time; Send waits for an agent.',
		dot: { tone: 'neutral', isHollow: false, isLive: false },
	},
}
