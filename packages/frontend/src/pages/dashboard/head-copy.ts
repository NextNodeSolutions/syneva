import { turnCounts } from '@entities/hub/turn'

import { numberWord } from './format'

import type { HubPlace } from '@entities/hub/hub-place'
import type { HubDesk } from '@entities/hub/model'
import type { HubPhase } from './hub-phase'

export type HeadCopy = {
	title: string
	isPending?: boolean
	lede?: string
	action?: 'start-hub' | 'sign-in'
}

export const EMPTY_TITLE = 'No desks open.'

// The statement over a listing: how many desks wait on the reviewer, or that none is open.
export function listedTitle(desks: readonly HubDesk[]): string {
	if (!desks.length) return EMPTY_TITLE
	const { yours } = turnCounts(desks)
	if (yours === 0) return 'No agent is waiting on you.'
	if (yours === 1) return `${numberWord(yours)} desk waits on you.`
	return `${numberWord(yours)} desks wait on you.`
}

const LOADING: HeadCopy = { title: 'Reading the hub…', isPending: true }

const SIGNED_OUT: HeadCopy = {
	title: 'Sign in again.',
	lede: "This browser's sign-in no longer opens the hub: its key changed, or the sign-in ended.",
	action: 'sign-in',
}

const UNREACHABLE: Record<HubPlace, HeadCopy> = {
	loopback: {
		title: 'The hub is not answering.',
		lede: 'If it was stopped, start it again on its machine. This page reconnects by itself.',
		action: 'start-hub',
	},
	network: {
		title: 'The hub is not answering.',
		lede: 'If it was stopped, start it again on its machine with the same --host and --key. This page reconnects by itself.',
	},
}

export function headCopy(phase: HubPhase, place: HubPlace): HeadCopy {
	if (phase.kind === 'loading') return LOADING
	if (phase.kind === 'signed-out') return SIGNED_OUT
	if (phase.kind === 'unreachable') return UNREACHABLE[place]
	return { title: listedTitle(phase.desks) }
}
