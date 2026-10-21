// The probe (RFC 0001, 4.1 to 4.3): a paired hub's one outbound socket to the web, kept open by
// the client policy of policy.ts - stop on a revoked or refused token, wait what a code names,
// back off with jitter otherwise, forever. Its link state is what the Hub page shows. Its one
// timer is the wait before the next attempt (the pings are the link's).
import { CLOSE_CODES } from '@syneva/contracts/bridge'

import { openLink } from './link.js'
import { nextStep } from './policy.js'

import type { PairingClose, PairingLink } from '@syneva/contracts/pairing'
import type { PairingRecord } from '../filesystem/bridge.js'
import type { Link, LinkDeps } from './link.js'
import type { AttemptEnd } from './policy.js'

export type ProbeDeps = Omit<LinkDeps, 'web' | 'token'> & {
	record: PairingRecord
	// The probe's link moved.
	onChange: () => void
}

export type ProbeState = { link: PairingLink; lastClose: PairingClose | null }

export type Probe = {
	state(): ProbeState
	// Settles once the first attempt connected or ended.
	settled(): Promise<void>
	// Closes the socket with `normal` and makes no other attempt; settles once it closed.
	close(): Promise<void>
}

export function startProbe(deps: ProbeDeps): Probe {
	const loop = new ProbeLoop(deps)
	loop.attempt()
	return {
		state: () => loop.state,
		settled: () => loop.firstOutcome,
		close: () => loop.close(),
	}
}

class ProbeLoop {
	state: ProbeState = { link: { state: 'off' }, lastClose: null }
	readonly #deps: ProbeDeps
	readonly #firstOutcome = Promise.withResolvers<void>()
	#link: Link | null = null
	#linkEnded: Promise<void> = Promise.resolve()
	#retry: NodeJS.Timeout | undefined
	// Attempts since the web last answered a ping: the backoff's exponent.
	#attempts = 0
	#isClosing = false

	constructor(deps: ProbeDeps) {
		this.#deps = deps
	}

	get firstOutcome(): Promise<void> {
		return this.#firstOutcome.promise
	}

	attempt(): void {
		const { record, onChange: _changed, ...linkDeps } = this.#deps
		this.#move({ link: { state: 'connecting', since: nowIso() } })
		const linkEnded = Promise.withResolvers<void>()
		this.#linkEnded = linkEnded.promise
		this.#link = openLink(
			{ ...linkDeps, web: record.web, token: record.token },
			{
				opened: () => {
					this.#opened()
				},
				answered: () => {
					this.#attempts = 0
				},
				ended: end => {
					this.#ended(end)
					linkEnded.resolve()
				},
			},
		)
	}

	async close(): Promise<void> {
		this.#isClosing = true
		clearTimeout(this.#retry)
		this.#link?.close(CLOSE_CODES.normal)
		await this.#linkEnded
		this.#move({ link: { state: 'off' } })
		this.#firstOutcome.resolve()
	}

	#opened(): void {
		const { record, log } = this.#deps
		log(`bridge: connected to ${record.web} as hub ${record.hubId}`)
		this.#move({ link: { state: 'connected', since: nowIso() } })
		this.#firstOutcome.resolve()
	}

	#ended(end: AttemptEnd): void {
		this.#link = null
		const lastClose = closeOf(end)
		this.#deps.log(
			`bridge: link to ${this.#deps.record.web} ended: ${lastClose.reason}`,
		)
		if (this.#isClosing) {
			this.#move({ lastClose })
			return
		}
		const step = nextStep(end, {
			attempt: this.#attempts,
			draw: Math.random(),
			scale: this.#deps.scale,
		})
		this.#attempts += 1
		if (step.kind === 'stop')
			this.#move({
				link: {
					state: 'stopped',
					reason: step.reason,
					since: nowIso(),
				},
				lastClose,
			})
		else this.#wait(step.waitMs, lastClose)
		this.#firstOutcome.resolve()
	}

	#wait(waitMs: number, lastClose: PairingClose): void {
		const until = new Date(Date.now() + waitMs).toISOString()
		this.#move({ link: { state: 'backoff', until }, lastClose })
		this.#retry = setTimeout(() => {
			this.attempt()
		}, waitMs)
	}

	#move(next: Partial<ProbeState>): void {
		this.state = { ...this.state, ...next }
		this.#deps.onChange()
	}
}

function nowIso(): string {
	return new Date().toISOString()
}

// What the Hub page and `syneva login` say of how the last attempt ended.
function closeOf(end: AttemptEnd): PairingClose {
	const at = nowIso()
	if (end.kind === 'closed')
		return { at, code: end.code, reason: closedWords(end.code, end.reason) }
	if (end.kind === 'refused')
		return {
			at,
			status: end.status,
			reason: `the upgrade was refused with HTTP ${end.status}`,
		}
	if (end.kind === 'failed') return { at, reason: end.reason }
	return { at, reason: 'the web stopped answering pings' }
}

const CODE_WORDS: ReadonlyMap<number, string> = new Map([
	[CLOSE_CODES.normal, 'closed'],
	[CLOSE_CODES.goingAway, 'the web went away'],
	[CLOSE_CODES.malformed, 'the web refused a frame'],
	[CLOSE_CODES.rate, 'rate exceeded'],
	[CLOSE_CODES.tooMany, 'too many hubs on this account'],
	[CLOSE_CODES.revoked, 'the token was revoked'],
	[CLOSE_CODES.saturated, 'the service is saturated'],
])

function closedWords(code: number, reason: string): string {
	const words = CODE_WORDS.get(code) ?? 'the connection dropped'
	return `closed with ${code} (${reason || words})`
}
