import {
	DESK_API_PREFIX,
	DESK_PAGE_PREFIX,
	HUB_PATHS,
	isDashboardPath,
	STATIC_PATHS,
} from '@syneva/contracts/routes'

import { errorMessage } from '../../../application/errors.js'

import { originAllowed } from './binding.js'
import { DOCS } from './failure.js'
import {
	HTTP_BAD_REQUEST,
	HTTP_INTERNAL,
	HTTP_MOVED_PERMANENTLY,
	HTTP_NOT_FOUND,
	BodyDecodeError,
	fail,
	html,
} from './http.js'
import {
	closeDeskRoute,
	DESK_NOT_FOUND,
	hubHealth,
	listDesks,
	openDeskRoute,
	readDesk,
	readJournal,
	saveHubSettings,
	serveHubSettings,
	shutdownHub,
} from './hub-routes.js'
import { DESK_NOT_OPEN, NOTHING_HERE, notFoundPage } from './pages.js'
import { FONT_FILE } from './routes/static.js'

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AccessGuard } from './auth.js'
import type { DeskContext } from './context.js'
import type { HubRouteDeps } from './hub-routes.js'
import type { StaticRequest, UiServer } from './routes/static.js'

// A desk route's whole world: the desk it belongs to, the request it answers, and the response
// it writes. Handlers end the response themselves - some stream (the await-send long-poll), some
// attach a post-flush hook (Send, close), so the dispatcher never writes on their behalf.
export type RouteRequest = {
	ctx: DeskContext
	req: IncomingMessage
	res: ServerResponse
	url: URL
}

export type RouteHandler = (request: RouteRequest) => Promise<void>

// Keyed `METHOD /path` (the path under the desk's API base) - the desk route registry. Values
// admit undefined because a lookup for any other method/path misses, which is the dispatcher's 404.
export type RouteTable = Readonly<Record<string, RouteHandler | undefined>>

export type HubRouterDeps = HubRouteDeps & {
	guard: AccessGuard
	// The authorities the origin guard accepts - a lookup, because the port is known only once
	// the server listens.
	authorities: () => readonly string[]
	deskRoutes: RouteTable
	ui: UiServer
}

// A desk id is the hex digest domain/identity derives; anything else never names a desk.
const DESK_ID = /^[a-f0-9]{8,64}$/

const NOT_FOUND_JSON = {
	status: HTTP_NOT_FOUND,
	code: 'NOT_FOUND',
	error: 'Not found',
	fix: `See ${DOCS} for the route list.`,
}

// The hub's request entry point: the origin guard for every route (current and future), the
// access guard, then the dispatch - the pages, the hub API, the per-desk API, the UI's assets -
// and the one place an unexpected throw becomes a 500.
export function createHubRequestHandler(
	deps: HubRouterDeps,
): (req: IncomingMessage, res: ServerResponse) => void {
	async function handle(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		try {
			if (!originAllowed(req, res, deps.authorities())) return
			const url = new URL(req.url ?? '/', 'http://127.0.0.1')
			if (await handleAccess(deps, req, res, url)) return
			const request: StaticRequest = { req, res, url }
			if (await handleDashboardPage(deps, request)) return
			// The hub listens before it rebuilds its desks (a restart's tabs reconnect at once):
			// what follows may name a desk, and one still being restored must not read as closed
			// - its page as not found, its tab as closed, the listing as empty.
			await deps.hub.restored()
			if (await handleDeskPage(deps, request)) return
			if (await handleHubApi(deps, request)) return
			if (await handleDashboardApi(deps, request)) return
			if (await handleDeskApi(deps, request)) return
			if (await handleUiAsset(deps, request)) return
			notFound(request)
		} catch (error) {
			reportFailure(res, error)
		}
	}
	return (req: IncomingMessage, res: ServerResponse): void => {
		void handle(req, res)
	}
}

// The sign-in pages, the public health probe and the font files answer before the access
// guard; everything else needs the key when one is configured. True once the request has been
// answered.
async function handleAccess(
	deps: HubRouterDeps,
	req: IncomingMessage,
	res: ServerResponse,
	url: URL,
): Promise<boolean> {
	if (url.pathname === HUB_PATHS.login) {
		await deps.guard.handleLogin(req, res, url)
		return true
	}
	if (url.pathname === HUB_PATHS.logout) {
		deps.guard.handleLogout(res)
		return true
	}
	if (url.pathname === HUB_PATHS.health && req.method === 'GET') {
		hubHealth(deps, res)
		return true
	}
	// The fonts are the design system's public OFL files and carry no hub data; without them a
	// keyed hub's sign-in page (pages.ts) could not set in Geist. Only a read of one font file
	// name under the fonts prefix passes - pinned here, not left to the UI server (the dev
	// loop's is Vite, which would take any path) - and only when the UI server has it: anything
	// else (the stylesheet, the bundles, the APIs) still meets the guard below.
	if (isFontRead(req, url) && (await deps.ui.asset({ req, res, url })))
		return true
	return !deps.guard.allows(req, res, url)
}

// Pages and assets answer GET and HEAD (a HEAD gets the same headers, Node drops the body).
function isRead(req: IncomingMessage): boolean {
	return req.method === 'GET' || req.method === 'HEAD'
}

function isFontRead(req: IncomingMessage, url: URL): boolean {
	const { pathname } = url
	const { fontsPrefix } = STATIC_PATHS
	return (
		isRead(req) &&
		pathname.startsWith(fontsPrefix) &&
		FONT_FILE.test(pathname.slice(fontsPrefix.length))
	)
}

// The dashboard's pages (isDashboardPath: the hub root, its sections, every project page) all
// answer with the one page shell - its assets load from absolute paths - which routes between
// them in the browser.
async function handleDashboardPage(
	deps: HubRouterDeps,
	request: StaticRequest,
): Promise<boolean> {
	if (!isRead(request.req)) return false
	if (!isDashboardPath(request.url.pathname)) return false
	await deps.ui.dashboardPage(request)
	return true
}

// The UI's assets come last. Every route above names its paths exactly; what is left is the
// UI server's to recognize: the bundle's fixed URLs in an install, any module of the source
// graph under the dev loop's Vite server - which must never be handed an API request (it
// would try to transform it).
async function handleUiAsset(
	deps: HubRouterDeps,
	request: StaticRequest,
): Promise<boolean> {
	if (!isRead(request.req)) return false
	return deps.ui.asset(request)
}

// /d/<id>/ serves the desk page for a live desk; /d/<id> (no slash) redirects onto it so the
// page's relative URLs resolve under the desk; an unknown id gets the not-found page.
async function handleDeskPage(
	deps: HubRouterDeps,
	request: StaticRequest,
): Promise<boolean> {
	const { req, res, url } = request
	if (!isRead(req) || !url.pathname.startsWith(DESK_PAGE_PREFIX)) return false
	const [id = '', ...rest] = url.pathname
		.slice(DESK_PAGE_PREFIX.length)
		.split('/')
	if (!DESK_ID.test(id)) return false
	if (!rest.length) {
		res.writeHead(HTTP_MOVED_PERMANENTLY, {
			location: `${url.pathname}/${url.search}`,
		})
		res.end()
		return true
	}
	if (rest.length > 1 || rest[0] !== '') return false
	if (deps.hub.getDesk(id)) await deps.ui.deskPage(request)
	else html(res, HTTP_NOT_FOUND, notFoundPage(DESK_NOT_OPEN, url.pathname))
	return true
}

// What no route answered: a page for a browser's navigation (it asks for HTML first), the
// JSON failure for everything else - an agent, a fetch.
function notFound({ req, res, url }: StaticRequest): void {
	const isNavigation =
		isRead(req) && (req.headers.accept ?? '').includes('text/html')
	if (isNavigation)
		html(res, HTTP_NOT_FOUND, notFoundPage(NOTHING_HERE, url.pathname))
	else fail(res, NOT_FOUND_JSON)
}

async function handleHubApi(
	deps: HubRouterDeps,
	{ req, res, url }: StaticRequest,
): Promise<boolean> {
	const method = req.method ?? ''
	if (url.pathname === HUB_PATHS.desks) {
		if (method === 'GET') listDesks(deps, res, url)
		else if (method === 'POST') await openDeskRoute(deps, req, res)
		else return false
		return true
	}
	if (url.pathname === HUB_PATHS.shutdown && method === 'POST') {
		shutdownHub(deps, res)
		return true
	}
	if (!url.pathname.startsWith(`${HUB_PATHS.desks}/`)) return false
	const id = url.pathname.slice(HUB_PATHS.desks.length + 1)
	if (!DESK_ID.test(id)) return false
	if (method === 'GET') readDesk(deps, res, id)
	else if (method === 'DELETE') closeDeskRoute(deps, res, id)
	else return false
	return true
}

// The dashboard's own API beside the desk registry: the journal it reads the hub's activity from,
// and the display preferences it shares with every desk.
async function handleDashboardApi(
	deps: HubRouterDeps,
	{ req, res, url }: StaticRequest,
): Promise<boolean> {
	if (url.pathname === HUB_PATHS.journal && req.method === 'GET') {
		await readJournal(deps, res, url)
		return true
	}
	if (url.pathname !== HUB_PATHS.settings) return false
	if (req.method === 'GET') await serveHubSettings(deps, res)
	else if (req.method === 'POST') await saveHubSettings(deps, req, res)
	else return false
	return true
}

// /api/desks/<id>/<route>: the desk's own API, dispatched through the per-desk route table
// with the prefix stripped. A route that exists but whose desk is gone answers DESK_NOT_FOUND
// (the tab's poll turns that into its desk-closed cover; the CLI into "no live desk").
async function handleDeskApi(
	deps: HubRouterDeps,
	{ req, res, url }: StaticRequest,
): Promise<boolean> {
	if (!url.pathname.startsWith(DESK_API_PREFIX)) return false
	const [id = '', ...tail] = url.pathname
		.slice(DESK_API_PREFIX.length)
		.split('/')
	if (!DESK_ID.test(id)) return false
	const route = deps.deskRoutes[`${req.method ?? ''} /${tail.join('/')}`]
	if (!route) return false
	const desk = deps.hub.getDesk(id)
	if (!desk) {
		fail(res, DESK_NOT_FOUND)
		return true
	}
	desk.liveness.requestStarted()
	res.on('close', () => desk.liveness.requestFinished())
	await route({ ctx: desk.ctx, req, res, url })
	return true
}

// The one place an unexpected throw becomes a response: a BodyDecodeError is the caller's
// bug (a malformed/oversized body) and answers 400; anything else is an INTERNAL 500.
function reportFailure(res: ServerResponse, error: unknown): void {
	if (res.headersSent) {
		res.end()
		return
	}
	if (error instanceof BodyDecodeError) {
		fail(res, {
			status: HTTP_BAD_REQUEST,
			code: 'INVALID_JSON',
			error: errorMessage(error),
			fix: `Send a JSON body of the documented shape. See ${DOCS} for the routes.`,
		})
		return
	}
	fail(res, {
		status: HTTP_INTERNAL,
		code: 'INTERNAL',
		error: errorMessage(error),
		fix: 'Unexpected server error; retry once, then reload the desk.',
	})
}
