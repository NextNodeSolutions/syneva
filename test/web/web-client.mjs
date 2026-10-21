// The smoke's browser: requests to the web with the session cookie it was handed and its own
// origin, as a tab's same-origin fetch sends them; redirects are read, never followed.
import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import {
	WEB_PATHS,
	WEB_SESSION_COOKIE,
} from '../../packages/contracts/dist/web.js'

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

// A hub paired over HTTP alone, as `syneva login` pairs one but with no socket after: a code,
// approved on the device page, its token taken. Its row is live; it never connects.
export async function pairSocketless(browser, name) {
	const code = await browser.post(BRIDGE_PATHS.deviceCode, {
		name,
		version: 'smoke',
	})
	const { userCode = '', deviceCode = '' } = code.body ?? {}
	const { proof } = await openDevicePage(browser, userCode)
	await approveDevice(browser, { userCode, proof })
	const taken = await browser.post(BRIDGE_PATHS.deviceToken, { deviceCode })
	return taken.body?.hubId ?? null
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
