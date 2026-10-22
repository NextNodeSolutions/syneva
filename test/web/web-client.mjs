// The smoke's browser: requests to the web with the session cookie it was handed and its own
// origin, as a tab's same-origin fetch sends them; redirects are read, never followed.
import { randomBytes } from 'node:crypto'
import http from 'node:http'

import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import {
	WEB_PATHS,
	WEB_SESSION_COOKIE,
} from '../../packages/contracts/dist/web.js'

import { HTTP_ACCEPTED } from './statuses.mjs'

const SOCKET_KEY_BYTES = 16

export function createBrowser(origin) {
	const jar = { cookie: '' }
	const browser = {
		origin,
		jar,
		headers(extra = {}) {
			return { origin, ...cookieOf(jar), ...extra }
		},
		fetch(route, init = {}) {
			return fetch(new URL(route, origin), {
				redirect: 'manual',
				...init,
				headers: browser.headers(init.headers),
			})
		},
		async json(route, init = {}) {
			const response = await browser.fetch(route, init)
			const text = await response.text()
			return {
				status: response.status,
				headers: response.headers,
				body: parsed(text),
			}
		},
		post(route, body, headers = {}) {
			return browser.json(route, {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers },
				body: JSON.stringify(body),
			})
		},
		// Keeps the session cookie a response set (or the clearing of it).
		keep(response) {
			const set = response.headers.get('set-cookie') ?? ''
			const [pair = ''] = set.split(';')
			const [name, ...value] = pair.split('=')
			if (name?.trim() !== WEB_SESSION_COOKIE) return set
			jar.cookie = value.join('=') ? pair.trim() : ''
			return set
		},
	}
	return browser
}

// What the sign-in link's page posts: its token, as the page's form sends it.
export function followLink(browser, link, headers = {}) {
	const token = new URL(link).searchParams.get('token') ?? ''
	return browser.fetch(WEB_PATHS.authCallback, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			...headers,
		},
		body: new URLSearchParams({ token }).toString(),
	})
}

const PROOF_FIELD = /name="confirm" value="([^"]+)"/

// The device page for a code, as the person opens it, with the approval proof its Approve holds.
export async function openDevicePage(browser, userCode) {
	const page = await browser.fetch(`${WEB_PATHS.device}?code=${userCode}`)
	const text = await page.text()
	const [, proof = ''] = PROOF_FIELD.exec(text) ?? []
	return { page, text, proof }
}

// Approve, as the device page's button posts it (JSON, the same fields).
export function approveDevice(browser, { userCode, proof }) {
	return browser.post(WEB_PATHS.device, {
		userCode,
		approve: true,
		confirm: proof,
	})
}

// Approve as the page's button posts it without a script (a form): the page that says what happened.
export async function approveByForm(browser, { userCode, proof }) {
	const page = await browser.fetch(WEB_PATHS.device, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			userCode,
			confirm: proof,
			approve: '1',
		}).toString(),
	})
	return { status: page.status, text: await page.text() }
}

// A hub paired over HTTP alone, as `syneva login` pairs one: a code (asked from `address` when
// one is given, so each pairing is its own client to the limits), approved on the device page,
// its token taken. Its row is live; it connects only when its caller opens its socket.
export async function pairHub(browser, { name, address }) {
	const code = await browser.post(
		BRIDGE_PATHS.deviceCode,
		{ name, version: 'smoke' },
		clientHeaders(address),
	)
	const { userCode = '', deviceCode = '' } = code.body ?? {}
	const { proof } = await openDevicePage(browser, userCode)
	await approveDevice(browser, { userCode, proof })
	const taken = await browser.post(BRIDGE_PATHS.deviceToken, { deviceCode })
	const { hubId, token } = taken.body ?? {}
	if (!hubId || !token) return null
	return { hubId, token }
}

// The client a request speaks from, as wrangler dev hands it on: none when no address is given.
function clientHeaders(address) {
	if (!address) return undefined
	return { 'cf-connecting-ip': address }
}

// Another account's browser, signed in; null when no session came. `headers` go with the link's
// request (a client of its own to the limits).
export async function signInAs(web, email, headers = {}) {
	const browser = createBrowser(web.origin)
	const seen = web.links().length
	const asked = await browser.post(WEB_PATHS.magicLink, { email }, headers)
	if (asked.status !== HTTP_ACCEPTED) return null
	browser.keep(await followLink(browser, await web.link(seen)))
	if (!browser.jar.cookie) return null
	return browser
}

// A hub paired that never connects: its id.
export async function pairSocketless(browser, name) {
	return (await pairHub(browser, { name }))?.hubId ?? null
}

// An upgrade as raw HTTP, to read a refusal whole where a WebSocket client reads only its status:
// the status and the body; a socket the web upgraded is let go at once.
export function upgradeAnswer(origin, route, headers) {
	return new Promise((resolve, reject) => {
		const request = http.get(new URL(route, origin), {
			headers: {
				...headers,
				connection: 'Upgrade',
				upgrade: 'websocket',
				'sec-websocket-version': '13',
				'sec-websocket-key':
					randomBytes(SOCKET_KEY_BYTES).toString('base64'),
			},
		})
		request.once('upgrade', (response, socket) => {
			socket.destroy()
			resolve({ status: response.statusCode, body: null })
		})
		request.once('response', response => {
			let text = ''
			response.setEncoding('utf8')
			response.on('data', chunk => {
				text += chunk
			})
			response.once('end', () => {
				resolve({ status: response.statusCode, body: parsed(text) })
			})
		})
		request.once('error', reject)
	})
}

// The cookie header the jar holds, if any.
function cookieOf(jar) {
	if (!jar.cookie) return undefined
	return { cookie: jar.cookie }
}

function parsed(text) {
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}
