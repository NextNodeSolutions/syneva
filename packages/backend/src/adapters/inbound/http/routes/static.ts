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
	html,
} from '../http.js'

import type { IncomingMessage, ServerResponse } from 'node:http'

export type StaticRequest = {
	req: IncomingMessage
	res: ServerResponse
	url: URL
}

// An install serves the built bundle; the dev loop passes a Vite dev server in its place (apps/syneva/scripts/dev.ts), so the same pages load from source on the hub's origin.
export type UiServer = {
	dashboardPage(request: StaticRequest): Promise<void>
	deskPage(request: StaticRequest): Promise<void>
	asset(request: StaticRequest): Promise<boolean>
}

// The bundle derives the desk id from its own URL (/d/<id>/), so the same index.html serves every desk and the hub injects nothing into it.
async function serveDeskPage({ res }: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(indexHtmlPath(), 'utf8'))
}

async function serveDashboardPage({ res }: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(dashboardHtmlPath(), 'utf8'))
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
	{ req, res }: Pick<StaticRequest, 'req' | 'res'>,
): Promise<void> {
	const stat = await fs.stat(file).catch(() => null)
	if (!stat?.isFile()) {
		res.writeHead(HTTP_NOT_FOUND)
		res.end()
		return
	}
	const etag = `"${stat.size}-${Math.round(stat.mtimeMs)}"`
	if (req.headers['if-none-match'] === etag) {
		res.writeHead(HTTP_NOT_MODIFIED)
		res.end()
		return
	}
	const body = await fs.readFile(file).catch(() => undefined)
	if (!body?.length) {
		res.writeHead(HTTP_NOT_FOUND)
		res.end()
		return
	}
	res.writeHead(HTTP_OK, {
		'content-type': contentType,
		etag,
		'cache-control': 'no-cache',
	})
	res.end(body)
}

async function serveUiChunk(request: StaticRequest): Promise<void> {
	const name = request.url.pathname.slice(STATIC_PATHS.chunksPrefix.length)
	if (!/^[\w-]+-[A-Za-z0-9]{8}\.js$/.test(name)) {
		request.res.writeHead(HTTP_NOT_FOUND)
		request.res.end()
		return
	}
	return serveAsset(uiChunkPath(name), JS_TYPE, request)
}

async function serveFont(request: StaticRequest): Promise<void> {
	const name = request.url.pathname.slice(STATIC_PATHS.fontsPrefix.length)
	if (!FONT_FILE.test(name)) {
		request.res.writeHead(HTTP_NOT_FOUND)
		request.res.end()
		return
	}
	return serveAsset(fontPath(name), FONT_TYPE, request)
}

function serveFavicon({ res }: StaticRequest): void {
	res.writeHead(HTTP_NO_CONTENT)
	res.end()
}

async function serveBuiltAsset(request: StaticRequest): Promise<boolean> {
	const { pathname } = request.url
	if (pathname === STATIC_PATHS.bundle)
		await serveAsset(uiBundlePath(), JS_TYPE, request)
	else if (pathname === STATIC_PATHS.dashboardBundle)
		await serveAsset(dashboardBundlePath(), JS_TYPE, request)
	else if (pathname === STATIC_PATHS.styles)
		await serveAsset(stylesPath(), CSS_TYPE, request)
	else if (pathname === STATIC_PATHS.favicon) serveFavicon(request)
	else if (pathname.startsWith(STATIC_PATHS.chunksPrefix))
		await serveUiChunk(request)
	else if (pathname.startsWith(STATIC_PATHS.fontsPrefix))
		await serveFont(request)
	else return false
	return true
}

// Frozen: the router sees a readonly port, never this module's internals.
export const builtUi: UiServer = Object.freeze({
	dashboardPage: serveDashboardPage,
	deskPage: serveDeskPage,
	asset: serveBuiltAsset,
})
