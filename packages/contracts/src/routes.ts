// Route constants shared by the browser, the CLI's hub-client and the HTTP adapter; no platform imports.
export const STATIC_PATHS = {
	index: '/',
	bundle: '/ui.js',
	dashboardBundle: '/dashboard.js',
	chunksPrefix: '/chunks/',
	styles: '/styles.css',
	fontsPrefix: '/fonts/',
	favicon: '/favicon.ico',
} as const

// Per-desk routes served under deskApiBase(id), which replaces the leading slash: /api/desks/<id>/state.
export const API_PATHS = {
	poll: '/poll',
	// The desk's pulse whole (bridge.ts DeskPulse): what a stream's partial pulse leaves out.
	pulse: '/pulse',
	state: '/state',
	settings: '/settings',
	tree: '/tree',
	file: '/file',
	blob: '/blob',
	fileContents: '/file-contents',
	inventory: '/inventory',
	authoring: '/authoring',
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

export const HUB_PATHS = {
	health: '/api/hub/health',
	desks: '/api/hub/desks',
	inventory: '/api/hub/inventory',
	journal: '/api/hub/journal',
	plans: '/api/hub/plans',
	settings: '/api/hub/settings',
	shutdown: '/api/hub/shutdown',
	// The hub's stream: a WebSocket of bridge frames (bridge.ts), a snapshot then every event.
	hubSocket: '/api/hub/ws',
	login: '/login',
	logout: '/logout',
} as const

// The most events one GET /api/hub/journal answers: a larger `limit` is clamped to it, and a read
// with more events after `after` than its limit answers the newest ones. A reader that keeps a
// window of this many events (the dashboard) therefore loses none it would hold to the cap.
export const JOURNAL_READ_MAX = 2000

// The dashboard's pages: the hub serves the dashboard's page shell at each of them (and at
// every project page under PROJECT_PAGE_PREFIX), and the dashboard routes between them in the
// browser, so each is also a URL that survives a reload or a shared link. Every plan page under
// PLAN_PAGE_PREFIX is one too.
export const DASHBOARD_PATHS = {
	overview: '/',
	reviews: '/reviews',
	projects: '/projects',
	plans: '/plans',
	settings: '/settings',
	hub: '/hub',
} as const

export const PROJECT_PAGE_PREFIX = '/projects/'

// One plan's page: /plans/<planId> (PlanSummary.id).
export const PLAN_PAGE_PREFIX = '/plans/'

// A project or plan id is the hex digest the hub derives; anything else never names one.
const PAGE_ID = /^[a-f0-9]{8,64}$/

export function planPagePath(planId: string): string {
	return `${PLAN_PAGE_PREFIX}${planId}`
}

// One project's page: /projects/<projectId> (DeskSummary.projectId).
export function projectPagePath(projectId: string): string {
	return `${PROJECT_PAGE_PREFIX}${projectId}`
}

// Whether the hub answers this path with the dashboard's page shell.
export function isDashboardPath(pathname: string): boolean {
	if (Object.values<string>(DASHBOARD_PATHS).includes(pathname)) return true
	return [PROJECT_PAGE_PREFIX, PLAN_PAGE_PREFIX].some(
		prefix =>
			pathname.startsWith(prefix) &&
			PAGE_ID.test(pathname.slice(prefix.length)),
	)
}

export const DESK_PAGE_PREFIX = '/d/'
export const DESK_API_PREFIX = '/api/desks/'

// Trailing slash so the page's relative URLs resolve under it.
export function deskPagePath(id: string): string {
	return `${DESK_PAGE_PREFIX}${id}/`
}

export function deskApiBase(id: string): string {
	return `${DESK_API_PREFIX}${id}`
}

export function hubDeskPath(id: string): string {
	return `${HUB_PATHS.desks}/${id}`
}

// The plan library's routes: one plan, one of its versions, its status.
export function hubPlanPath(id: string): string {
	return `${HUB_PATHS.plans}/${id}`
}

export function hubPlanVersionPath(id: string, version: number): string {
	return `${hubPlanPath(id)}/versions/${String(version)}`
}

export function hubPlanStatusPath(id: string): string {
	return `${hubPlanPath(id)}/status`
}
