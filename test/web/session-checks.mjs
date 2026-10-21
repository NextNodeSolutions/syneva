// The web before and after a session: what a signed-out browser gets, the magic link printed on
// wrangler's stdout and followed, what the session then opens, and sign-out.
import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'
import { WEB_PATHS } from '../../packages/contracts/dist/web.js'
import { openReader, socketUrl } from '../stream/stream-client.mjs'

import { pagePolicyGap } from './page-checks.mjs'
import {
	HTTP_ACCEPTED,
	HTTP_FORBIDDEN,
	HTTP_FOUND,
	HTTP_OK,
	HTTP_SEE_OTHER,
	HTTP_UNAUTHORIZED,
} from './statuses.mjs'
import { followLink } from './web-client.mjs'

export const EMAIL = 'smoke@example.com'

export async function checkSignedOut({ report, browser, web }) {
	report.section('signed out')
	const health = await browser.json(HUB_PATHS.health)
	report.check(
		'GET /api/hub/health answers a hub health, no key, no desk',
		health.status === HTTP_OK &&
			health.body.ok === true &&
			health.body.keyRequired === false &&
			health.body.desks === 0,
		JSON.stringify(health.body),
	)
	const root = await browser.fetch('/')
	report.check(
		'GET / without a session redirects to /login',
		root.status === HTTP_FOUND &&
			root.headers.get('location') === WEB_PATHS.login,
		`${root.status} ${root.headers.get('location')}`,
	)
	const page = await browser.fetch('/reviews')
	report.check(
		'a dashboard page without a session redirects to sign in, back after',
		page.status === HTTP_FOUND &&
			page.headers.get('location') ===
				`${WEB_PATHS.login}?next=%2Freviews`,
		`${page.status} ${page.headers.get('location')}`,
	)
	const me = await browser.json(WEB_PATHS.me)
	report.check(
		'GET /api/web/me is 401 UNAUTHORIZED',
		me.status === HTTP_UNAUTHORIZED && me.body.code === 'UNAUTHORIZED',
		`${me.status}`,
	)
	const tab = openReader(
		socketUrl(web.origin, BRIDGE_PATHS.tabSocket),
		browser.headers(),
	)
	const outcome = await tab.outcome.catch(error => error.message)
	report.check(
		'a tab upgrade without a session is refused 401',
		outcome === HTTP_UNAUTHORIZED,
		`${outcome}`,
	)
	const ops = await browser.json(BRIDGE_PATHS.opsStatus)
	report.check(
		'the ops status without its token is 403',
		ops.status === HTTP_FORBIDDEN,
		`${ops.status}`,
	)
}

// Asks for a link, follows it; throws when no link came, since nothing after can run.
export async function checkSignIn({ report, browser, web }) {
	report.section('sign-in')
	const seen = web.links().length
	const asked = await browser.post(WEB_PATHS.magicLink, {
		email: EMAIL,
		next: '/hub',
	})
	report.check(
		'POST /auth/magic-link is 202 { sent: true }',
		asked.status === HTTP_ACCEPTED && asked.body.sent === true,
		`${asked.status} ${JSON.stringify(asked.body)}`,
	)
	const link = await report.step(
		'the link is printed (MAIL_TRANSPORT=log)',
		() => web.link(seen),
	)
	if (!link) throw new Error('no sign-in link: nothing else can run')
	await checkLinkPage({ report, browser }, link)
	const followed = await followLink(browser, link)
	const cookie = browser.keep(followed)
	report.check(
		'its button (a same-origin POST) opens a session: 303 to `next`, an HttpOnly SameSite=Lax cookie',
		followed.status === HTTP_SEE_OTHER &&
			followed.headers.get('location') === '/hub' &&
			/HttpOnly/i.test(cookie) &&
			/SameSite=Lax/i.test(cookie) &&
			Boolean(browser.jar.cookie),
		`${followed.status} ${followed.headers.get('location')} ${cookie}`,
	)
	const again = await followLink(browser, link)
	const reopened = await fetch(link, { redirect: 'manual' })
	report.check(
		'posted a second time, or opened again, the link lands on /login?expired=1',
		[again, reopened].every(
			answer =>
				answer.status === HTTP_SEE_OTHER &&
				answer.headers.get('location') ===
					`${WEB_PATHS.login}?expired=1`,
		),
		`${again.status} ${again.headers.get('location')}, ${reopened.status}`,
	)
	await checkSession({ report, browser })
}

// The link's GET is what a mail scanner fetches: it names the account and changes nothing, and
// only a same-origin POST takes it.
async function checkLinkPage({ report, browser }, link) {
	const opened = await fetch(link, { redirect: 'manual' })
	const text = await opened.text()
	const gap = pagePolicyGap(opened, text)
	const reopened = await fetch(link, { redirect: 'manual' })
	await reopened.body?.cancel()
	report.check(
		"the link opens a page naming the account, under the pages' policy, and spends nothing: twice 200, no cookie",
		opened.status === HTTP_OK &&
			reopened.status === HTTP_OK &&
			text.includes(EMAIL) &&
			text.includes('name="token"') &&
			!gap &&
			!opened.headers.get('set-cookie') &&
			!reopened.headers.get('set-cookie'),
		`${opened.status} ${reopened.status} ${gap ?? ''}`,
	)
	const crossSite = await followLink(browser, link, {
		origin: 'http://evil.example',
	})
	report.check(
		"another site's POST of the token is 403 FORBIDDEN_ORIGIN, no cookie",
		crossSite.status === HTTP_FORBIDDEN &&
			!crossSite.headers.get('set-cookie'),
		`${crossSite.status}`,
	)
}

async function checkSession({ report, browser }) {
	const me = await browser.json(WEB_PATHS.me)
	report.check(
		'GET /api/web/me names the person',
		me.status === HTTP_OK &&
			me.body.email === EMAIL &&
			Boolean(me.body.userId),
		JSON.stringify(me.body),
	)
	const shell = await browser.fetch('/reviews')
	report.check(
		'a dashboard page with the cookie serves the dashboard shell',
		shell.status === HTTP_OK &&
			(await shell.text()).includes('dashboard.js'),
		`${shell.status}`,
	)
	const written = await browser.post(HUB_PATHS.settings, { theme: 'night' })
	const read = await browser.json(HUB_PATHS.settings)
	report.check(
		'settings are written and read back',
		written.status === HTTP_OK && read.body.theme === 'night',
		JSON.stringify(read.body),
	)
	const crossSite = await browser.post(
		HUB_PATHS.settings,
		{ theme: 'day' },
		{ origin: 'http://evil.example' },
	)
	report.check(
		'a cross-site POST is refused 403 FORBIDDEN_ORIGIN',
		crossSite.status === HTTP_FORBIDDEN &&
			crossSite.body.code === 'FORBIDDEN_ORIGIN',
		`${crossSite.status}`,
	)
}

export async function checkSignOut({ report, browser, web }) {
	report.section('sign-out')
	const before = browser.jar.cookie
	// As the device page's "not you?" signs out: sign-in lands back on the code.
	const back = `${WEB_PATHS.device}?code=ABCD-EFGH`
	const out = await browser.fetch(WEB_PATHS.logout, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ next: back }).toString(),
	})
	const cleared = browser.keep(out)
	report.check(
		'POST /logout clears the cookie, 303 to /login with its `next`',
		out.status === HTTP_SEE_OTHER &&
			out.headers.get('location') ===
				`${WEB_PATHS.login}?next=${encodeURIComponent(back)}` &&
			/Max-Age=0/i.test(cleared),
		`${out.status} ${out.headers.get('location')} ${cleared}`,
	)
	const me = await fetch(new URL(WEB_PATHS.me, web.origin), {
		headers: { cookie: before },
	})
	report.check(
		'the old cookie opens nothing: 401',
		me.status === HTTP_UNAUTHORIZED,
		`${me.status}`,
	)
}
