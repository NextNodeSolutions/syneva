import {
	DESK_API_PREFIX,
	DESK_PAGE_PREFIX,
	HUB_PATHS,
	isDashboardPath,
	STATIC_PATHS,
} from '@syneva/contracts/routes'

import { isHexId } from '../../../domain/identity.js'

import { originRefusal } from './binding.js'
import { dashboardApi } from './dashboard-api.js'
import { openExchange } from './exchange.js'
import { DOCS } from './failure.js'
import {
	HTTP_MOVED_PERMANENTLY,
	HTTP_NOT_FOUND,
	bodiless,
	fail,
	failureOf,
	html,
} from './http.js'
import {
	closeDeskRoute,
	DESK_NOT_FOUND,
	hubHealth,
	inventoryRoute,
	listDesks,
	openDeskRoute,
	readDesk,
	shutdownHub,
} from './hub-routes.js'
import { DESK_NOT_OPEN, NOTHING_HERE, notFoundPage } from './pages.js'
import { planApi } from './plan-routes.js'
import { FONT_FILE } from './routes/static.js'

import type { AccessGuard } from './auth.js'
import type { DeskContext } from './context.js'
import type { HubRequest, Served } from './exchange.js'
import type { HubRouteDeps } from './hub-routes.js'
import type { DeskLiveness } from './liveness.js'
import type { UiServer } from './routes/static.js'

// A desk route's whole world: its desk and its request. It returns its response whole; work that
// must follow the response is deferred through afterSent (exchange.ts), never hooked on a socket.
export type RouteRequest = HubRequest & { ctx: DeskContext }

export type RouteHandler = (route: RouteRequest) => Promise<Response>

export type RouteTable = Readonly<Record<string, RouteHandler | undefined>>

export type HubRouterDeps = HubRouteDeps & {
	guard: AccessGuard
	// A lookup: the port is known only once the server listens.
	authorities: () => readonly string[]
	deskRoutes: RouteTable
	ui: UiServer
}

// The hub's request entry point, on the Fetch API: what a transport (node-adapter.ts, a Durable
// Object) calls with each Request, and the Served it writes back.
export type HubRouter = (request: Request) => Promise<Served>

const NOT_FOUND_JSON = {
	status: HTTP_NOT_FOUND,
	code: 'NOT_FOUND',
	error: 'Not found',
	fix: `See ${DOCS} for the route list.`,
}

// The origin guard for every route, the access guard, then dispatch (pages, hub API, per-desk API, assets) - and the one place an unexpected throw becomes a 500.
export function createHubRouter(deps: HubRouterDeps): HubRouter {
	return async request => {
		const exchange = openExchange(request)
		try {
			const answered = await answer(deps, exchange.hub)
			if (answered) return exchange.served(answered)
			const missing = notFound(exchange.hub)
			if (isRead(request)) return exchange.unclaimed(missing)
			return exchange.served(missing)
		} catch (error) {
			return exchange.served(failureOf(error))
		}
	}
}

// Null when no route claimed the request.
async function answer(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	const refused = originRefusal(hub.request, deps.authorities())
	if (refused) return refused
	const access = await accessStage(deps, hub)
	if (access) return access
	const page = await dashboardPage(deps, hub)
	if (page) return page
	// The hub listens before it rebuilds its desks (a restart's tabs reconnect at once): a request naming a desk still being restored must not read as closed - its page as not found, its tab as closed, the listing as empty.
	await deps.hub.restored()
	return (
		(await deskPage(deps, hub)) ??
		(await hubApi(deps, hub)) ??
		(await dashboardApi(deps, hub)) ??
		(await planApi(deps, hub)) ??
		(await deskApi(deps, hub)) ??
		(await uiAsset(deps, hub))
	)
}

// The sign-in pages, the public health probe and the font files answer before the access guard; everything else needs the key when one is configured.
async function accessStage(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	const { request, url } = hub
	if (url.pathname === HUB_PATHS.login) return deps.guard.login(request, url)
	if (url.pathname === HUB_PATHS.logout) return deps.guard.logout()
	if (url.pathname === HUB_PATHS.health && request.method === 'GET')
		return hubHealth(deps)
	// The fonts are the design system's public OFL files: no hub data, and a keyed hub's sign-in could not load Geist without them.
	// One font file name under the prefix passes - pinned here, not left to the UI server (the dev loop's would take any path) - and only when the UI server has it.
	const font = isFontRead(request, url) ? await deps.ui.asset(hub) : null
	if (font) return font
	return deps.guard.refusal(request, url)
}

// Pages and assets answer GET and HEAD (a HEAD gets the same headers; the transport drops the body).
function isRead(request: Request): boolean {
	return request.method === 'GET' || request.method === 'HEAD'
}

function isFontRead(request: Request, url: URL): boolean {
	const { pathname } = url
	const { fontsPrefix } = STATIC_PATHS
	return (
		isRead(request) &&
		pathname.startsWith(fontsPrefix) &&
		FONT_FILE.test(pathname.slice(fontsPrefix.length))
	)
}

async function dashboardPage(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	if (!isRead(hub.request)) return null
	if (!isDashboardPath(hub.url.pathname)) return null
	return deps.ui.dashboardPage(hub)
}

// The UI's assets come last: every route above names its paths exactly, so the rest belongs to the
// UI server to recognize (fixed bundle URLs in an install; under the dev loop, any source-graph
// module, which Vite answers from the reads left unclaimed and must never receive an API request -
// it would try to transform it).
async function uiAsset(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	if (!isRead(hub.request)) return null
	return deps.ui.asset(hub)
}

// /d/<id>/ serves the desk page; /d/<id> (no slash) redirects so the page's relative URLs resolve under the desk; an unknown id gets the not-found page.
async function deskPage(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	const { request, url } = hub
	if (!isRead(request) || !url.pathname.startsWith(DESK_PAGE_PREFIX))
		return null
	const [id = '', ...rest] = url.pathname
		.slice(DESK_PAGE_PREFIX.length)
		.split('/')
	if (!isHexId(id)) return null
	if (!rest.length)
		return bodiless(HTTP_MOVED_PERMANENTLY, {
			location: `${url.pathname}/${url.search}`,
		})
	if (rest.length > 1 || rest[0] !== '') return null
	if (deps.hub.getDesk(id)) return deps.ui.deskPage(hub)
	return html(HTTP_NOT_FOUND, notFoundPage(DESK_NOT_OPEN, url.pathname))
}

// What no route answered: a page for a browser's navigation (it asks for HTML first), the JSON failure for everything else.
function notFound({ request, url }: HubRequest): Response {
	const isNavigation =
		isRead(request) &&
		(request.headers.get('accept') ?? '').includes('text/html')
	if (isNavigation)
		return html(HTTP_NOT_FOUND, notFoundPage(NOTHING_HERE, url.pathname))
	return fail(NOT_FOUND_JSON)
}

async function hubApi(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	const { request, url } = hub
	const { method } = request
	if (url.pathname === HUB_PATHS.desks) {
		if (method === 'GET') return listDesks(deps, url)
		if (method === 'POST') return openDeskRoute(deps, request)
		return null
	}
	if (url.pathname === HUB_PATHS.inventory && method === 'POST')
		return inventoryRoute(deps, request)
	if (url.pathname === HUB_PATHS.shutdown && method === 'POST')
		return shutdownHub(deps, hub)
	if (!url.pathname.startsWith(`${HUB_PATHS.desks}/`)) return null
	const id = url.pathname.slice(HUB_PATHS.desks.length + 1)
	if (!isHexId(id)) return null
	if (method === 'GET') return readDesk(deps, id)
	if (method === 'DELETE') return closeDeskRoute(deps, id)
	return null
}

// /api/desks/<id>/<route>: the desk's own API, dispatched through the per-desk route table with the prefix stripped.
// A route whose desk is gone answers DESK_NOT_FOUND (the tab's poll turns that into its desk-closed cover, the CLI into "no live desk").
async function deskApi(
	deps: HubRouterDeps,
	hub: HubRequest,
): Promise<Response | null> {
	const { request, url } = hub
	if (!url.pathname.startsWith(DESK_API_PREFIX)) return null
	const [id = '', ...tail] = url.pathname
		.slice(DESK_API_PREFIX.length)
		.split('/')
	if (!isHexId(id)) return null
	const route = deps.deskRoutes[`${request.method} /${tail.join('/')}`]
	if (!route) return null
	const desk = deps.hub.getDesk(id)
	if (!desk) return fail(DESK_NOT_FOUND)
	stampActivity(desk.liveness, hub)
	return route({ ...hub, ctx: desk.ctx })
}

// A desk's last activity is stamped when one of its requests starts and again when it ends:
// answered (once handed over) or abandoned (the client gone first, which only a request the
// server parks lives long enough to see).
function stampActivity(liveness: DeskLiveness, hub: HubRequest): void {
	liveness.requestStarted()
	const finished = (): void => {
		liveness.requestFinished()
	}
	hub.afterSent(finished)
	hub.request.signal.addEventListener('abort', finished, { once: true })
}
