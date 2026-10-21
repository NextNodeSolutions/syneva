import type { HubRequest } from './exchange.js'

// What a UI server reads of a request: the request and its URL.
export type UiRequest = Pick<HubRequest, 'request' | 'url'>

// The pages and assets of the UI, behind a port the router calls: an install serves the built bundle from disk (local's routes/static.ts); the dev loop passes its own pages in its place (apps/syneva/scripts/dev.ts) and answers the module graph through Vite's middleware, which the Node adapter offers the reads no route claimed (Served.isUnclaimedRead), so the same pages load from source on the hub's origin.
export type UiServer = {
	dashboardPage(request: UiRequest): Promise<Response>
	deskPage(request: UiRequest): Promise<Response>
	// The UI file this read names (its own not-found included), or null when the path is none of the UI's.
	asset(request: UiRequest): Promise<Response | null>
}

// One segment, no traversal, a woff2: the router lets exactly this shape through before the access guard, whatever UI server answers it.
export const FONT_FILE = /^[\w-]+\.woff2$/
