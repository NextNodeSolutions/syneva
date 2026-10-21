import { promises as fs } from 'node:fs'

import { STATIC_PATHS } from '@syneva/contracts/routes'

import {
	dashboardBundlePath,
	dashboardHtmlPath,
	fontPath,
	indexHtmlPath,
	stylesPath,
	uiBundlePath,
	uiChunkPath,
} from '../assets.js'
import {
	HTTP_NO_CONTENT,
	HTTP_NOT_FOUND,
	HTTP_NOT_MODIFIED,
	HTTP_OK,
	bodiless,
	html,
} from '../http.js'

import type { HubRequest } from '../exchange.js'

// What a UI server reads of a request: the request and its URL.
export type UiRequest = Pick<HubRequest, 'request' | 'url'>

// An install serves the built bundle; the dev loop passes its own pages in its place (apps/syneva/scripts/dev.ts) and answers the module graph through Vite's middleware, which the Node adapter offers the reads no route claimed (Served.isUnclaimedRead), so the same pages load from source on the hub's origin.
export type UiServer = {
	dashboardPage(request: UiRequest): Promise<Response>
	deskPage(request: UiRequest): Promise<Response>
	// The UI file this read names (its own not-found included), or null when the path is none of the UI's.
	asset(request: UiRequest): Promise<Response | null>
}

// The bundle derives the desk id from its own URL (/d/<id>/), so the same index.html serves every desk and the hub injects nothing into it.
async function serveDeskPage(): Promise<Response> {
	return html(HTTP_OK, await fs.readFile(indexHtmlPath(), 'utf8'))
}

async function serveDashboardPage(): Promise<Response> {
	return html(HTTP_OK, await fs.readFile(dashboardHtmlPath(), 'utf8'))
}

const JS_TYPE = 'text/javascript; charset=utf-8'
const CSS_TYPE = 'text/css; charset=utf-8'
const FONT_TYPE = 'font/woff2'

// One segment, no traversal, a woff2: the router lets exactly this shape through before the access guard, whatever UI server answers it.
export const FONT_FILE = /^[\w-]+\.woff2$/

// Assets change only on a rebuild, so they carry an etag derived from size+mtime: the tab revalidates cheaply and a 304 skips the body entirely.
async function serveAsset(
	file: string,
	contentType: string,
	request: Request,
): Promise<Response> {
	const stat = await fs.stat(file).catch(() => null)
	if (!stat?.isFile()) return bodiless(HTTP_NOT_FOUND)
	const etag = `"${stat.size}-${Math.round(stat.mtimeMs)}"`
	if (request.headers.get('if-none-match') === etag)
		return bodiless(HTTP_NOT_MODIFIED)
	const body = await fs.readFile(file).catch(() => undefined)
	if (!body?.length) return bodiless(HTTP_NOT_FOUND)
	return new Response(body, {
		status: HTTP_OK,
		headers: {
			'content-type': contentType,
			etag,
			'cache-control': 'no-cache',
		},
	})
}

async function serveUiChunk({ request, url }: UiRequest): Promise<Response> {
	const name = url.pathname.slice(STATIC_PATHS.chunksPrefix.length)
	// A chunk is named after its module, which may hold dots (diagram.styles-<hash>.js); a dot
	// only ever sits between name segments, so no name reaches outside the chunks folder.
	if (!/^[\w-]+(?:\.[\w-]+)*-[A-Za-z0-9]{8}\.js$/.test(name))
		return bodiless(HTTP_NOT_FOUND)
	return serveAsset(uiChunkPath(name), JS_TYPE, request)
}

async function serveFont({ request, url }: UiRequest): Promise<Response> {
	const name = url.pathname.slice(STATIC_PATHS.fontsPrefix.length)
	if (!FONT_FILE.test(name)) return bodiless(HTTP_NOT_FOUND)
	return serveAsset(fontPath(name), FONT_TYPE, request)
}

async function serveBuiltAsset(ui: UiRequest): Promise<Response | null> {
	const { pathname } = ui.url
	const { request } = ui
	if (pathname === STATIC_PATHS.bundle)
		return serveAsset(uiBundlePath(), JS_TYPE, request)
	if (pathname === STATIC_PATHS.dashboardBundle)
		return serveAsset(dashboardBundlePath(), JS_TYPE, request)
	if (pathname === STATIC_PATHS.styles)
		return serveAsset(stylesPath(), CSS_TYPE, request)
	if (pathname === STATIC_PATHS.favicon) return bodiless(HTTP_NO_CONTENT)
	if (pathname.startsWith(STATIC_PATHS.chunksPrefix)) return serveUiChunk(ui)
	if (pathname.startsWith(STATIC_PATHS.fontsPrefix)) return serveFont(ui)
	return null
}

// Frozen: the router sees a readonly port, never this module's internals.
export const builtUi: UiServer = Object.freeze({
	dashboardPage: serveDashboardPage,
	deskPage: serveDeskPage,
	asset: serveBuiltAsset,
})
