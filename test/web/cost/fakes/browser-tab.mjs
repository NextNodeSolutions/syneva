// A tab as a person's browser holds it: the frontend's own stream transport, run in a Node process
// of its own as a browser gives a page its own (browser-tab-realm.mjs), which reconnects by its own
// policy while this side writes down what it did. Its record reads like a PolicyClient's, so a drill judges both kinds of
// client the same way (rfc-waits.mjs):
// - `trace`, in order: { type: 'attempt', at, outcome } per upgrade it tried, its outcome 'open',
//   the status its probe read when it was refused (the tab's only way to know it), or 'failed';
//   { type: 'retry', at, waitMs, kind, draw, cause } per wait it chose, `cause` the end it read.
// - `attempts`, `retries`, `opens` (when each socket opened), `drops` ({ at, code } per socket that
//   closed after opening) and `frames`.
import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { within } from './timing.mjs'

const REALM = fileURLToPath(new URL('./browser-tab-realm.mjs', import.meta.url))
const STOP_WITHIN_MS = 2000
const STDERR_KEPT = 2000

export class BrowserTab {
	trace = []
	attempts = []
	retries = []
	opens = []
	drops = []
	frames = []
	/** @type {{ kind: string, retryAt?: number } | null} */
	link = null
	stopped = false
	stopReason = null
	isOpen = false
	/** @type {import('node:child_process').ChildProcess | null} */
	#realm = null
	#stderr = ''
	/** @type {{ type: 'attempt', at: number, outcome: string | number | null } | null} */
	#current = null
	// The end the page read last: { kind: 'closed', code }, { kind: 'refused', status }, { kind: 'failed' }.
	/** @type {{ kind: string, code?: number, status?: number } | null} */
	#cause = null
	/** @type {number | null} */
	#draw = null
	#stopped = Promise.withResolvers()

	// `origin` is the page's (where the tab was loaded), `cookie` the person's session cookie.
	constructor({ name, origin, cookie }) {
		this.name = name
		this.origin = origin
		this.cookie = cookie
	}

	start() {
		const page = {
			origin: this.origin,
			cookie: this.cookie,
			label: this.name,
		}
		const realm = fork(REALM, [JSON.stringify(page)], {
			stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
		})
		this.#realm = realm
		realm.on('message', message => {
			this.#read(message)
		})
		realm.stderr.on('data', chunk => {
			this.#stderr = `${this.#stderr}${chunk}`.slice(-STDERR_KEPT)
		})
		realm.on('exit', code => {
			if (this.#realm !== realm || code === 0) return
			this.stopped = true
			this.stopReason = `the page exited ${code}: ${this.#stderr}`
		})
	}

	// The socket ends under the tab (closed from its side, as a network change ends it).
	drop() {
		this.#realm?.send({ type: 'drop' })
	}

	async stop() {
		if (!this.#realm?.connected) return this.terminate()
		this.#realm.send({ type: 'stop' })
		await within(STOP_WITHIN_MS, 'stop', this.#stopped.promise).catch(
			() => undefined,
		)
		return this.terminate()
	}

	// Its exit, which comes later, finds it no longer this tab's page and reports nothing.
	terminate() {
		this.#realm?.kill()
		this.#realm = null
		this.isOpen = false
	}

	#read(message) {
		const { type, at } = message
		if (type === 'attempt') {
			this.#current = { type, at, outcome: null }
			this.#cause = null
			this.trace.push(this.#current)
			this.attempts.push(this.#current)
		} else if (type === 'open') {
			this.#current.outcome = 'open'
			this.isOpen = true
			this.opens.push(at)
		} else if (type === 'close') this.#closed(message)
		else if (type === 'probe') {
			this.#current.outcome = message.status ?? 'failed'
			this.#cause =
				message.status === null
					? { kind: 'failed' }
					: { kind: 'refused', status: message.status }
		} else if (type === 'draw') this.#draw = message.draw
		else if (type === 'state') this.#state(message)
		else if (type === 'frame')
			this.frames.push({ frame: message.frame, at })
		else if (type === 'stopped') this.#stopped.resolve()
	}

	// A socket that had opened ended: a drop, read as its close code. One that never opened is a
	// refusal, which the probe that follows names.
	#closed({ code, at }) {
		if (!this.isOpen) return
		this.isOpen = false
		this.drops.push({ at, code })
		this.#cause = { kind: 'closed', code }
	}

	#state({ link, at }) {
		this.link = link
		if (link.kind === 'signed-out') {
			this.stopped = true
			this.stopReason = 'signed-out'
		}
		if (!('retryAt' in link)) return
		const retry = {
			type: 'retry',
			at,
			waitMs: link.retryAt - at,
			kind: link.kind,
			// The draw the transport took for this wait: its backoff takes one, right before.
			draw: link.kind === 'backoff' ? this.#draw : null,
			cause: this.#cause ?? { kind: 'unknown' },
		}
		this.#draw = null
		this.trace.push(retry)
		this.retries.push(retry)
	}
}
