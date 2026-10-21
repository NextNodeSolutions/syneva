// The people and hubs the tests run as. Locally an account signs in through the magic link the
// Worker prints on wrangler's stdout; on a deployed Worker it is a session cookie the person hands
// over (`--cookie`, one per account), since a real mailbox is not ours to open. A hub is paired the
// way `syneva login` pairs one - a device code, approved on the device page with the account's
// cookie, then its token asked once - so every fake hub is a real row of the web's D1.
import {
	BRIDGE_PATHS,
	WEB_HUB_HEADER,
} from '../../../packages/contracts/dist/bridge.js'
import {
	WEB_PATHS,
	WEB_SESSION_COOKIE,
} from '../../../packages/contracts/dist/web.js'
import { createBrowser } from '../web-client.mjs'

import { FakeHub } from './fakes/fake-hub.mjs'
import { FakeTab } from './fakes/fake-tab.mjs'
import { delay } from './fakes/timing.mjs'

const HTTP_OK = 200
const HTTP_TOO_MANY = 429
const RATE_RETRY_MS = 6000
const RATE_RETRIES = 20

export { WEB_HUB_HEADER }

export function createAccounts(ctx) {
	const people = []
	return {
		async get(index = 0) {
			people[index] ??= await openAccount(ctx, index)
			return people[index]
		},
	}
}

async function openAccount(ctx, index) {
	const { web, staging, options } = ctx
	const email = `cost-${index}@example.com`
	const browser = createBrowser(web.origin)
	if (staging) {
		const cookie = options.cookie[index]
		if (!cookie)
			throw new Error(
				`account ${index} needs a session cookie: pass --cookie ${index + 1} times`,
			)
		browser.jar.cookie = cookie.includes('=')
			? cookie
			: `${WEB_SESSION_COOKIE}=${cookie}`
		const me = await browser.json(WEB_PATHS.me)
		if (me.status !== HTTP_OK)
			throw new Error(
				`the cookie of account ${index} opens no session (${me.status})`,
			)
	} else {
		await signIn(web, browser, email)
	}
	return { index, email, browser, hubs: [] }
}

// The magic link, asked for and followed.
async function signIn(web, browser, email) {
	const seen = web.links().length
	const asked = await browser.post(WEB_PATHS.magicLink, { email })
	if (asked.status !== 202)
		throw new Error(`sign-in refused: ${asked.status}`)
	const followed = await fetch(await web.link(seen), { redirect: 'manual' })
	browser.keep(followed)
	if (!browser.jar.cookie) throw new Error('the link opened no session')
}

// A hub of `account`, paired on first use; hubs 0..index are paired in order.
export async function hubOf(ctx, account, index) {
	while (account.hubs.length <= index) {
		const paired = await pairHub(account, `cost-hub-${account.hubs.length}`)
		account.hubs.push(
			new FakeHub({
				...paired,
				origin: ctx.web.origin,
				name: paired.name,
			}),
		)
	}
	return account.hubs[index]
}

// Device code, approval with the account's cookie, token: waits out the rate limiter's 429s
// (ten tries a minute per address and per person) instead of failing on them.
async function pairHub(account, name) {
	const { browser } = account
	const code = await untilAllowed(() =>
		browser.post(BRIDGE_PATHS.deviceCode, { name, version: 'cost-test' }),
	)
	if (code.status !== HTTP_OK) throw new Error(`device code: ${code.status}`)
	const approved = await untilAllowed(() =>
		browser.post(WEB_PATHS.device, {
			userCode: code.body.userCode,
			approve: true,
		}),
	)
	if (approved.status !== HTTP_OK)
		throw new Error(
			`approval: ${approved.status} ${JSON.stringify(approved.body)}`,
		)
	const token = await browser.post(BRIDGE_PATHS.deviceToken, {
		deviceCode: code.body.deviceCode,
	})
	if (!token.body.token)
		throw new Error(`token: ${token.status} ${JSON.stringify(token.body)}`)
	return { hubId: token.body.hubId, token: token.body.token, name }
}

async function untilAllowed(request, tries = RATE_RETRIES) {
	const answer = await request()
	if (answer.status !== HTTP_TOO_MANY || tries === 0) return answer
	await delay(RATE_RETRY_MS)
	return untilAllowed(request, tries - 1)
}

// A tab of `account`, connected unless `connect` is false.
export async function tabOf(ctx, account, { connect = true, pingMs = 0 } = {}) {
	const tab = new FakeTab({
		origin: ctx.web.origin,
		headers: account.browser.headers(),
	})
	ctx.track(tab)
	if (!connect) return tab
	const outcome = await tab.connect({ pingMs })
	if (outcome !== 'open')
		throw new Error(`a tab upgrade was refused (${outcome})`)
	return tab
}
