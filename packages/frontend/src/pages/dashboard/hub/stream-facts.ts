import { untilWords } from '@shared/lib/until-words'
import { BRIDGE_LIMITS, CLOSE_CODES } from '@syneva/contracts/bridge'
import { HUB_STATE } from '@widgets/hub-shell/hub-state'

import { MS_PER_SECOND, relativeTime } from '../format'

import type { HubLink } from '@entities/hub/link'
import type { StreamClose } from '@shared/api/stream'
import type { Fact } from './fact-list'

// What the browser itself reports when a socket ends without a close frame (the hub went away,
// or refused the upgrade).
const ABNORMAL_CLOSURE = 1006
const NORMAL_CLOSURE = 1000

const CLOSE_MEANING: ReadonlyMap<number, string> = new Map([
	[NORMAL_CLOSURE, 'closed by this page'],
	[CLOSE_CODES.goingAway, 'the hub stopped'],
	[CLOSE_CODES.malformed, 'the hub refused a frame'],
	[ABNORMAL_CLOSURE, 'the connection dropped, or was refused'],
	[CLOSE_CODES.rate, 'rate limited'],
	[CLOSE_CODES.tooMany, 'too many tabs'],
	[CLOSE_CODES.revoked, 'signed out'],
	[CLOSE_CODES.silent, 'no ping of this page reached the hub'],
	[CLOSE_CODES.slow, 'this page fell behind the hub'],
	[CLOSE_CODES.saturated, 'saturated'],
])

const TIME = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' })

function closeWords(close: StreamClose | null, now: number): string {
	if (!close) return 'None since this page opened'
	const when = relativeTime(close.at, now)
	if (close.code === 'no-pong')
		return `No pong within ${BRIDGE_LIMITS.pongTimeoutMs / MS_PER_SECOND}s, dropped by this page (${when})`
	const meaning = CLOSE_MEANING.get(close.code) ?? 'unlisted code'
	return `${close.code}: ${meaning} (${when})`
}

function nextAttempt(link: HubLink, now: number): string {
	if (link.status === 'live') return 'None needed'
	if (link.status === 'signed-out') return 'None: sign in again'
	if (!link.retryAt || link.retryAt <= now) return 'Under way'
	return `${TIME.format(link.retryAt)} (in ${untilWords(link.retryAt, now)})`
}

// The page's stream as facts: how it stands and since when, the hub that said hello on it, why
// the last socket ended, and when the next attempt goes.
export function streamFacts(link: HubLink, now: number): Fact[] {
	const { identity } = link
	return [
		{ key: 'State', value: HUB_STATE[link.status].word },
		{
			key: 'Connected since',
			value: link.liveSince
				? `${TIME.format(link.liveSince)} (${relativeTime(link.liveSince, now)})`
				: 'Not connected',
		},
		{
			key: 'Hub',
			value: identity
				? `${identity.name} (${identity.id}), v${identity.version}`
				: 'No hello yet',
		},
		{ key: 'Last close', value: closeWords(link.lastClose, now) },
		{ key: 'Next attempt', value: nextAttempt(link, now) },
	]
}
