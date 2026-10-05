import { promises as fs } from 'node:fs'

import { STATIC_PATHS } from '@syneva/contracts/routes'

import {
	dashboardBundlePath,
	dashboardHtmlPath,
	indexHtmlPath,
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

// The static routes carry no desk: the hub serves one UI bundle for every desk page and the
// dashboard page at its root.
export type StaticRequest = {
	req: IncomingMessage
	res: ServerResponse
	url: URL
}

// What answers the browser UI's requests: the two page shells and the assets they load. An
// install serves the built bundle (builtUi below); the dev loop passes a Vite dev server in its
// place (apps/syneva/scripts/dev.ts), so the same pages load from source on the hub's origin.
export type UiServer = {
	dashboardPage(request: StaticRequest): Promise<void>
	deskPage(request: StaticRequest): Promise<void>
	// True once the request has been answered, false when the path is none of the UI's assets.
	asset(request: StaticRequest): Promise<boolean>
}

// The desk page. The bundle derives the desk id from its own URL (/d/<id>/), so the same
// index.html serves every desk and the hub injects nothing into it.
async function serveDeskPage({ res }: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(indexHtmlPath(), 'utf8'))
}

async function serveDashboardPage({ res }: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(dashboardHtmlPath(), 'utf8'))
}

// An etag'd JS asset server. Assets change only on a rebuild, so they carry an
// etag derived from size+mtime: the tab revalidates cheaply and a 304 skips the body entirely.
async function serveJsBundle(
	file: string,
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
	const js = await fs.readFile(file, 'utf8').catch(() => undefined)
	if (!js) {
		res.writeHead(HTTP_NOT_FOUND)
		res.end()
		return
	}
	res.writeHead(HTTP_OK, {
		'content-type': 'text/javascript; charset=utf-8',
		etag,
		'cache-control': 'no-cache',
	})
	res.end(js)
}

async function serveUiChunk(request: StaticRequest): Promise<void> {
	const name = request.url.pathname.slice(STATIC_PATHS.chunksPrefix.length)
	if (!/^[\w-]+-[A-Za-z0-9]{8}\.js$/.test(name)) {
		request.res.writeHead(HTTP_NOT_FOUND)
		request.res.end()
		return
	}
	return serveJsBundle(uiChunkPath(name), request)
}

function serveFavicon({ res }: StaticRequest): void {
	res.writeHead(HTTP_NO_CONTENT)
	res.end()
}

async function serveBuiltAsset(request: StaticRequest): Promise<boolean> {
	const { pathname } = request.url
	if (pathname === STATIC_PATHS.bundle)
		await serveJsBundle(uiBundlePath(), request)
	else if (pathname === STATIC_PATHS.dashboardBundle)
		await serveJsBundle(dashboardBundlePath(), request)
	else if (pathname === STATIC_PATHS.favicon) serveFavicon(request)
	else if (pathname.startsWith(STATIC_PATHS.chunksPrefix))
		await serveUiChunk(request)
	else return false
	return true
}

// The UI of an install: the built bundle next to the server. Frozen: the router sees a
// readonly port, never this module's internals.
export const builtUi: UiServer = Object.freeze({
	dashboardPage: serveDashboardPage,
	deskPage: serveDeskPage,
	asset: serveBuiltAsset,
})
