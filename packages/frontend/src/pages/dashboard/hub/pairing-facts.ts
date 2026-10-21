import { untilWords } from '@shared/lib/until-words'

import { relativeTime } from '../format'

import type { HubPairing, PairingLink } from '@entities/hub/pairing'
import type { Fact } from './fact-list'

type Paired = Extract<HubPairing, { paired: true }>

const TIME = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' })
const DATE = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

const STOPPED: Record<'revoked' | 'unauthorized', string> = {
	revoked: 'the web revoked this hub',
	unauthorized: 'the web refused its token',
}

function at(time: number, now: number): string {
	return `${TIME.format(time)} (${relativeTime(time, now)})`
}

// Where the hub's socket to the web stands, as a reviewer reads it.
function linkWords(link: PairingLink, now: number): string {
	if (link.state === 'connected')
		return `Connected since ${at(link.since, now)}`
	if (link.state === 'connecting')
		return `Connecting since ${at(link.since, now)}`
	if (link.state === 'stopped')
		return `Stopped: ${STOPPED[link.reason]} (${relativeTime(link.since, now)}); it tries again only once paired anew`
	if (link.state === 'off') return 'Off: the hub is stopping'
	if (link.until <= now) return 'Trying again now'
	return `Next attempt at ${TIME.format(link.until)} (in ${untilWords(link.until, now)})`
}

// A paired hub as facts: the web it is paired with, the hub as the web knows it, since when,
// where its socket stands and why the last one ended.
export function pairingFacts(pairing: Paired, now: number): Fact[] {
	const { lastClose } = pairing
	return [
		{ key: 'Web', value: pairing.web },
		{ key: 'Hub on the web', value: `${pairing.name} (${pairing.hubId})` },
		{
			key: 'Paired',
			value: `${DATE.format(pairing.pairedAt)} (${relativeTime(pairing.pairedAt, now)})`,
		},
		{ key: 'Link', value: linkWords(pairing.link, now) },
		{
			key: 'Last close',
			value: lastClose
				? `${lastClose.reason} (${relativeTime(lastClose.at, now)})`
				: 'None since the hub started',
		},
	]
}
