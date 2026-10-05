import { numberWord } from './format'

import type { HubPhase } from './hub-phase'
import type { HubPlace } from './hub-place'

// What the head says for a phase: the statement (the page's h1), the lede under it, and the
// one action the phase asks for. `isPending` marks the loading line, which stays hidden for
// the first moments of a load: a hub that answers at once never flashes it. `isAlone` marks a
// head with no listing under it (signed out, a hub never reached, an empty hub, whose band
// sits low on the footer): no rule closes it, so the paper under it reads as its own space.
export type HeadCopy = {
	title: string
	isPending?: boolean
	isAlone?: boolean
	lede?: string
	action?: 'start-hub' | 'sign-in'
}

const LISTING_LEDE =
	'Every desk this hub hosts, by repository. A desk stays open across rounds until you or your agent close it.'

function statement(yours: number): string {
	if (yours === 0) return 'No agent is waiting on you.'
	if (yours === 1) return `${numberWord(yours)} desk waits on you.`
	return `${numberWord(yours)} desks wait on you.`
}

const LOADING: HeadCopy = { title: 'Reading the hub…', isPending: true }

const SIGNED_OUT: HeadCopy = {
	title: 'Sign in again.',
	isAlone: true,
	lede: "This browser's sign-in no longer opens the hub: its key changed, or the sign-in ended.",
	action: 'sign-in',
}

// A hub never reached: the command to start it again, for a loopback hub; a hub reached over
// the network restarts the way it was started (hub-place.ts).
const UNREACHABLE: Record<HubPlace, HeadCopy> = {
	loopback: {
		title: 'The hub is not answering.',
		isAlone: true,
		lede: 'If it was stopped, start it again on its machine. This page reconnects by itself.',
		action: 'start-hub',
	},
	network: {
		title: 'The hub is not answering.',
		isAlone: true,
		lede: 'If it was stopped, start it again on its machine with the same --host and --key. This page reconnects by itself.',
	},
}

const EMPTY: HeadCopy = {
	title: 'No desks open.',
	isAlone: true,
	lede: 'The hub is running. Nothing is under review yet.',
}

export function headCopy(phase: HubPhase, place: HubPlace): HeadCopy {
	if (phase.kind === 'loading') return LOADING
	if (phase.kind === 'signed-out') return SIGNED_OUT
	if (phase.kind === 'unreachable') return UNREACHABLE[place]
	if (!phase.desks.length) return EMPTY
	return { title: statement(phase.counts.yours), lede: LISTING_LEDE }
}
