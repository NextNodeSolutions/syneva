// The page a BrowserTab runs, one Node process each: the frontend's own stream transport
// (packages/frontend/src/shared/api/stream.ts), loaded from its source through tsx, with the three
// things a browser lends it stood in for and nothing else - `window.location`, a WebSocket that
// sends the page's cookie and origin as a browser's does, a fetch that resolves against the page
// and sends its cookie - and every attempt, probe, random draw and state it goes through posted to
// the parent over IPC as it happens, stamped here. The transport's own code decides every wait.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const { origin, cookie, label } = JSON.parse(process.argv[2])
const NORMAL_CLOSURE = 1000

const post = message => {
	process.send({ ...message, at: Date.now() })
}

// The page's own cookie and origin, as a browser attaches them to its upgrade and same-origin
// fetches; `x-cost-client` names the tab to the local edge stand-in (edge.mjs), which no Worker
// reads.
const pageHeaders = { cookie, origin, 'x-cost-client': label }

globalThis.window = { location: { href: `${origin}/` } }

const NativeWebSocket = globalThis.WebSocket
let current = null
globalThis.WebSocket = class PageWebSocket extends NativeWebSocket {
	constructor(url, protocols) {
		super(url, { protocols: protocols ?? [], headers: pageHeaders })
		current = this
		post({ type: 'attempt' })
		// Registered before the transport's own listeners, so the parent reads each event first.
		this.addEventListener('open', () => {
			post({ type: 'open' })
		})
		this.addEventListener('close', event => {
			post({ type: 'close', code: event.code })
		})
	}
}

// The body is read here, as a browser drains a response nobody reads, so no connection is held.
const nativeFetch = globalThis.fetch
globalThis.fetch = async (input, init = {}) => {
	const url = new URL(input, window.location.href)
	const headers = new Headers(init.headers)
	for (const [name, value] of Object.entries(pageHeaders))
		headers.set(name, value)
	try {
		const response = await nativeFetch(url, {
			...init,
			redirect: 'manual',
			headers,
		})
		const body = await response.arrayBuffer()
		post({ type: 'probe', status: response.status })
		return new Response(body, {
			status: response.status,
			headers: response.headers,
		})
	} catch (error) {
		post({ type: 'probe', status: null })
		throw error
	}
}

// Every draw the transport takes, so a wait's jitter is known to whoever judges it.
const nativeRandom = Math.random
Math.random = () => {
	const draw = nativeRandom()
	post({ type: 'draw', draw })
	return draw
}

const requireFromCli = createRequire(
	new URL('../../../../apps/syneva/package.json', import.meta.url),
)
const { tsImport } = await import(
	pathToFileURL(requireFromCli.resolve('tsx/esm/api')).href
)
const { openHubStream } = await tsImport(
	new URL(
		'../../../../packages/frontend/src/shared/api/stream.ts',
		import.meta.url,
	).href,
	import.meta.url,
)

const stream = openHubStream({
	onFrame: frame => {
		post({ type: 'frame', frame })
	},
	onState: state => {
		post({ type: 'state', link: state.link })
	},
})

process.on('message', message => {
	// A socket ending under the tab, as a network change or a deploy ends it: the transport reads
	// it as any drop.
	if (message.type === 'drop') current?.close(NORMAL_CLOSURE)
	if (message.type === 'stop') {
		stream.stop()
		post({ type: 'stopped' })
	}
})
