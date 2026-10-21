// The pages the frontend renders (the dashboard's and a desk's), served as their built shells from
// the assets (scripts/build.mjs puts them under /_shell/). A shell holds no data: every read it
// makes goes through the session routes, so a cookie that merely looks present is enough to hand
// it over (no D1 read per navigation), and a browser without one is sent to sign in first.
import { splitWebDeskId } from '@syneva/contracts/bridge'
import {
	DASHBOARD_PATHS,
	DESK_PAGE_PREFIX,
	PLAN_PAGE_PREFIX,
	PROJECT_PAGE_PREFIX,
} from '@syneva/contracts/routes'

import { sessionCookie } from '../auth/session.js'
import { PAGE_GUARDS, toSignIn } from '../http/answer.js'
import { isRead } from '../http/call.js'
import { HTTP_MOVED_PERMANENTLY } from '../http/status.js'

import type { Call } from '../http/call.js'

const SHELLS = {
	dashboard: '/_shell/dashboard',
	desk: '/_shell/desk',
} as const

// A project or plan page's id: hex, a local id (8 to 64) or a web one (16 more).
const PAGE_ID = /^[a-f0-9]{8,80}$/
const HEX = /^[a-f0-9]+$/

export async function shellRoute(call: Call): Promise<Response | null> {
	const { request, url } = call
	if (!isRead(request)) return null
	const shell = shellOf(url.pathname)
	if (!shell) return null
	if ('redirect' in shell)
		return new Response(null, {
			status: HTTP_MOVED_PERMANENTLY,
			headers: { location: `${shell.redirect}${url.search}` },
		})
	if (!sessionCookie(request)) return toSignIn(`${url.pathname}${url.search}`)
	const served = await call.env.ASSETS.fetch(new URL(shell.path, url))
	// The shell's own caching headers would let a signed-out browser reuse it; it is tiny.
	const headers = new Headers(served.headers)
	headers.set('cache-control', 'no-store')
	for (const [name, value] of Object.entries(SHELL_GUARDS))
		headers.set(name, value)
	return new Response(served.body, { status: served.status, headers })
}

// A shell is never framed: a desk's Approve or Send under another site's transparent overlay acts
// on the person's machine. The rest of its policy is the frontend's to say; this one directive
// constrains nothing it loads.
const SHELL_GUARDS = {
	'content-security-policy': "frame-ancestors 'none'",
	...PAGE_GUARDS,
} as const

function shellOf(
	pathname: string,
): { path: string } | { redirect: string } | null {
	if (isWebDashboardPath(pathname)) return { path: SHELLS.dashboard }
	if (!pathname.startsWith(DESK_PAGE_PREFIX)) return null
	const [id = '', ...rest] = pathname
		.slice(DESK_PAGE_PREFIX.length)
		.split('/')
	const named = splitWebDeskId(id)
	if (!named || !HEX.test(named.deskId)) return null
	if (!rest.length) return { redirect: `${pathname}/` }
	if (rest.length > 1 || rest[0] !== '') return null
	return { path: SHELLS.desk }
}

// contracts' isDashboardPath, with web ids in project and plan pages.
function isWebDashboardPath(pathname: string): boolean {
	if (Object.values<string>(DASHBOARD_PATHS).includes(pathname)) return true
	return [PROJECT_PAGE_PREFIX, PLAN_PAGE_PREFIX].some(
		prefix =>
			pathname.startsWith(prefix) &&
			PAGE_ID.test(pathname.slice(prefix.length)),
	)
}
