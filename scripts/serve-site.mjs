import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
// Zero-dependency dev server for the landing page (site/). Static assets are
// read straight from site/; page routes are rendered from site/src on every
// request, in a fresh process, so edits show on reload without a restart.
// The page scripts are ES modules, which browsers refuse on file:// (CORS),
// so local viewing needs a real HTTP origin.
//
// Run: pnpm dev:site. Reuse an existing landing server instead of starting another.
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'../site',
)
const RENDER_SCRIPT = path.join(SITE_ROOT, 'src', 'render.mjs')
const DEFAULT_PORT = 4321
const PORT = Number(process.env.PORT) || DEFAULT_PORT

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.ico': 'image/x-icon',
}
const HTTP_REDIRECT = 301
const HTTP_FORBIDDEN = 403
const HTTP_OK = 200
const HTTP_NOT_FOUND = 404
const HTTP_ERROR = 500
const NO_PAGE_EXIT = 2
// A rendered page is well under a megabyte; the buffer only has to not clip it.
const RENDER_BUFFER_BYTES = 16_777_216

function renderRoute(route) {
	return new Promise(resolve => {
		execFile(
			process.execPath,
			[RENDER_SCRIPT, route],
			{ maxBuffer: RENDER_BUFFER_BYTES },
			(error, stdout, stderr) => {
				if (!error) resolve({ status: HTTP_OK, body: stdout })
				else if (error.code === NO_PAGE_EXIT)
					resolve({ status: HTTP_NOT_FOUND })
				else resolve({ status: HTTP_ERROR, body: stderr })
			},
		)
	})
}

function sendHtml(res, status, body) {
	res.writeHead(status, {
		'content-type': MIME['.html'],
		'cache-control': 'no-store',
	})
	res.end(body)
}

async function servePage(res, pathname) {
	const route = pathname.endsWith('/') ? pathname : `${pathname}/`
	const page = await renderRoute(route)
	// Like the static assets host: a page URL without its slash redirects.
	if (page.status === HTTP_OK && route !== pathname) {
		res.writeHead(HTTP_REDIRECT, { location: route }).end()
		return
	}
	if (page.status === HTTP_OK) {
		sendHtml(res, HTTP_OK, page.body)
		return
	}
	if (page.status === HTTP_ERROR) {
		sendHtml(res, HTTP_ERROR, `<pre>${page.body}</pre>`)
		return
	}
	const notFound = await renderRoute('/404')
	sendHtml(res, HTTP_NOT_FOUND, notFound.body ?? 'Not found')
}

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost')
	const pathname = decodeURIComponent(url.pathname)
	// Page routes are directory URLs; anything with an extension is an asset.
	if (!path.extname(pathname)) {
		await servePage(res, pathname)
		return
	}
	// Confine the resolved path to site/ - a request path can never escape the
	// served root, and the page sources are not served as assets.
	const file = path.resolve(SITE_ROOT, pathname.replace(/^\/+/, ''))
	if (
		!file.startsWith(SITE_ROOT + path.sep) ||
		file.startsWith(path.join(SITE_ROOT, 'src') + path.sep)
	) {
		res.writeHead(HTTP_FORBIDDEN).end()
		return
	}
	try {
		await stat(file)
		const body = await readFile(file)
		res.writeHead(HTTP_OK, {
			'content-type':
				MIME[path.extname(file)] ?? 'application/octet-stream',
			'cache-control': 'no-store',
		})
		res.end(body)
	} catch {
		res.writeHead(HTTP_NOT_FOUND, {
			'content-type': 'text/plain; charset=utf-8',
		})
		res.end('Not found')
	}
})

server.listen(PORT, '127.0.0.1', () => {
	process.stdout.write(`Landing page: http://localhost:${PORT}\n`)
})
