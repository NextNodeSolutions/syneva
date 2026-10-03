import { promises as fs } from 'node:fs'

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

// The desk page. The bundle derives the desk id from its own URL (/d/<id>/), so the same
// index.html serves every desk and the hub injects nothing into it.
export async function serveDeskPage({ res }: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(await indexHtmlPath(), 'utf8'))
}

export async function serveDashboardPage({
	res,
}: StaticRequest): Promise<void> {
	html(res, HTTP_OK, await fs.readFile(await dashboardHtmlPath(), 'utf8'))
}

// An etag'd JS asset server. Assets change only on a rebuild, so they carry an
// etag derived from size+mtime: the tab revalidates cheaply and a 304 skips the body entirely.
async function serveJsBundle(
	pathOf: () => Promise<string>,
	{ req, res }: Pick<StaticRequest, 'req' | 'res'>,
): Promise<void> {
	const file = await pathOf()
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

export async function serveUiBundle(request: StaticRequest): Promise<void> {
	return serveJsBundle(uiBundlePath, request)
}

export async function serveDashboardBundle(
	request: StaticRequest,
): Promise<void> {
	return serveJsBundle(dashboardBundlePath, request)
}

export async function serveUiChunk(request: StaticRequest): Promise<void> {
	const name = request.url.pathname.slice('/chunks/'.length)
	if (!/^[\w-]+-[A-Za-z0-9]{8}\.js$/.test(name)) {
		request.res.writeHead(HTTP_NOT_FOUND)
		request.res.end()
		return
	}
	return serveJsBundle(() => uiChunkPath(name), request)
}

export async function serveFavicon({ res }: StaticRequest): Promise<void> {
	res.writeHead(HTTP_NO_CONTENT)
	res.end()
}
