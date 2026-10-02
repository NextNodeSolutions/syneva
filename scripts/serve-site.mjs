import { readFile, stat } from 'node:fs/promises'
// Zero-dependency static server for the landing page (site/). The page loads
// motion.js and navigation.js as ES modules, which browsers refuse on file://
// (CORS), so local viewing needs a real HTTP origin.
//
// Run: pnpm dev:site   (http://localhost:4173)
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'../site',
)
const DEFAULT_PORT = 4173
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
const HTTP_FORBIDDEN = 403
const HTTP_OK = 200
const HTTP_NOT_FOUND = 404

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost')
	// URL-decode and confine the resolved path to site/ - a request path can
	// never escape the served root.
	const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '')
	const file = path.resolve(SITE_ROOT, relative || 'index.html')
	if (!file.startsWith(SITE_ROOT + path.sep) && file !== SITE_ROOT) {
		res.writeHead(HTTP_FORBIDDEN).end()
		return
	}
	try {
		const assetStat = await stat(file)
		const target = assetStat.isDirectory()
			? path.join(file, 'index.html')
			: file
		const body = await readFile(target)
		res.writeHead(HTTP_OK, {
			'content-type':
				MIME[path.extname(target)] ?? 'application/octet-stream',
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
