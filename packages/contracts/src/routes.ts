// The hub's HTTP surface: static asset URLs and API route paths, as one allowlist.
// A neutral dependency sink like the rest of packages/contracts/src - no backend/frontend
// imports, no platform API - so the browser, the agent-facing CLI (hub-client),
// and the HTTP adapter all name their endpoints from the same constants and the
// wire stays in sync by construction.

// Static assets served from the built bundle root (see the http adapter's assets.ts). The
// dashboard page is the hub root; a desk page lives under DESK_PAGE_PREFIX (deskPagePath).
export const STATIC_PATHS = {
	index: '/',
	bundle: '/ui.js',
	dashboardBundle: '/dashboard.js',
	chunksPrefix: '/chunks/',
	// The one stylesheet the page shells link (StyleX's rules for every page, the font faces).
	styles: '/styles.css',
	// The design system's font files the stylesheet's faces point at.
	fontsPrefix: '/fonts/',
	favicon: '/favicon.ico',
} as const

// Per-desk JSON API routes (the browser tab's fetch surface and the agent CLI's hub-client).
// Each is served under the desk's API base (deskApiBase): /api/desks/<id>/api/… is NOT the
// shape - the base replaces the leading slash, e.g. /api/desks/<id>/state.
export const API_PATHS = {
	poll: '/poll',
	state: '/state',
	settings: '/settings',
	tree: '/tree',
	file: '/file',
	blob: '/blob',
	fileContents: '/file-contents',
	openEditor: '/open-editor',
	save: '/save',
	send: '/send',
	ask: '/ask',
	awaitSend: '/await-send',
	reload: '/reload',
	comment: '/comment',
	status: '/status',
	reset: '/reset',
	stage: '/stage',
	stageChange: '/stage-change',
	unstage: '/unstage',
	shutdown: '/shutdown',
} as const

// Hub-level routes: liveness, the desk registry, the journal, the display preferences (the
// same ~/.syneva/settings.json a desk's /settings reads, for the dashboard, which has no desk
// base), and the access-key session pages.
export const HUB_PATHS = {
	health: '/api/hub/health',
	desks: '/api/hub/desks',
	journal: '/api/hub/journal',
	settings: '/api/hub/settings',
	shutdown: '/api/hub/shutdown',
	login: '/login',
	logout: '/logout',
} as const

// The dashboard's pages: the hub serves the dashboard's page shell at each of them (and at
// every project page under PROJECT_PAGE_PREFIX), and the dashboard routes between them in the
// browser, so each is also a URL that survives a reload or a shared link.
export const DASHBOARD_PATHS = {
	overview: '/',
	reviews: '/reviews',
	projects: '/projects',
	plans: '/plans',
	settings: '/settings',
	hub: '/hub',
} as const

export const PROJECT_PAGE_PREFIX = '/projects/'

// One project's page: /projects/<projectId> (DeskSummary.projectId).
export function projectPagePath(projectId: string): string {
	return `${PROJECT_PAGE_PREFIX}${projectId}`
}

// Whether the hub answers this path with the dashboard's page shell.
export function isDashboardPath(pathname: string): boolean {
	if (Object.values<string>(DASHBOARD_PATHS).includes(pathname)) return true
	const rest = pathname.slice(PROJECT_PAGE_PREFIX.length)
	return (
		pathname.startsWith(PROJECT_PAGE_PREFIX) &&
		/^[a-f0-9]{8,64}$/.test(rest)
	)
}

export const DESK_PAGE_PREFIX = '/d/'
export const DESK_API_PREFIX = '/api/desks/'

// The desk page: /d/<id>/ (trailing slash, so the page's relative URLs resolve under it).
export function deskPagePath(id: string): string {
	return `${DESK_PAGE_PREFIX}${id}/`
}

// The desk's API base: deskApiBase(id) + API_PATHS.state is the full path.
export function deskApiBase(id: string): string {
	return `${DESK_API_PREFIX}${id}`
}

// One desk's hub registry entry: GET (summary) / DELETE (close).
export function hubDeskPath(id: string): string {
	return `${HUB_PATHS.desks}/${id}`
}
