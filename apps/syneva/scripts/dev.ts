// Dev composition root: the hub from source + a Vite dev server on the hub's own port/origin (same URLs/guards, nothing built, HMR); node --watch restarts on a backend/contracts change while the hub restores desks.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseArgs } from '@syneva/backend/adapters/inbound/cli/args'
import {
	runStart,
	SIGNAL_EXIT_CODE,
} from '@syneva/backend/adapters/inbound/cli/start'
import { createServer } from 'vite'

import type {
	StaticRequest,
	UiServer,
} from '@syneva/backend/adapters/inbound/http/routes/static'
import type { ViteDevServer } from 'vite'

const FRONTEND_ROOT = fileURLToPath(
	new URL('../../../packages/frontend', import.meta.url),
)
const PAGE_SHELLS = path.join(FRONTEND_ROOT, 'src/app')
const LOOPBACK = '127.0.0.1'
const HTTP_OK = 200
const USER_ARG_START_INDEX = 2

// Read from source on every request; Vite swaps in the source entry + HMR client (sourceEntriesPlugin).
function servePage(
	vite: ViteDevServer,
	shell: string,
): UiServer['dashboardPage'] {
	return async ({ res, url }: StaticRequest): Promise<void> => {
		const source = await readFile(path.join(PAGE_SHELLS, shell), 'utf8')
		const page = await vite.transformIndexHtml(url.pathname, source)
		res.writeHead(HTTP_OK, { 'content-type': 'text/html; charset=utf-8' })
		res.end(page)
	}
}

// A response Vite ends never reaches next(), so the response's close is the "answered" signal.
function serveModule(
	vite: ViteDevServer,
	{ req, res }: StaticRequest,
): Promise<boolean> {
	return new Promise((resolve, reject) => {
		res.once('close', () => resolve(true))
		vite.middlewares(req, res, (error?: unknown) => {
			if (error) reject(error)
			else resolve(false)
		})
	})
}

function viteUi(vite: ViteDevServer): UiServer {
	return {
		dashboardPage: servePage(vite, 'dashboard.html'),
		deskPage: servePage(vite, 'index.html'),
		asset: request => serveModule(vite, request),
	}
}

// Running from source reports version 0.0.0, which would offer the update check on every start.
process.env.SYNEVA_NO_UPDATE_CHECK = '1'

// Ctrl-C ends a dev session; a signal-status exit would report it as a failed script.
process.on('exit', code => {
	if (code === SIGNAL_EXIT_CODE) process.exitCode = 0
})

const vite = await createServer({
	root: FRONTEND_ROOT,
	appType: 'custom',
	// Imported through tsx so --watch tracks it like source; the default loader bundles it into a per-start temp module, which the watcher answers with a restart loop.
	configLoader: 'native',
	// Vite wipes the terminal before each HMR line, taking the hub's own output with it.
	clearScreen: false,
	// The hub's server is the origin; Vite keeps only its HMR socket, on loopback.
	server: { middlewareMode: true, hmr: { host: LOOPBACK } },
})

// --no-open keeps a watch restart from popping a new dashboard tab; the URL is announced.
await runStart(
	parseArgs(['--no-open', ...process.argv.slice(USER_ARG_START_INDEX)]),
	viteUi(vite),
)

// runStart holds the process while the hub serves; returning = it never bound (the machine's hub likely answers the port already).
process.stderr.write(
	'The dev hub did not start. If another hub holds the port, stop it with `syneva hub stop` (its desks are restored here) and rerun `pnpm dev`.\n',
)
await vite.close()
process.exitCode = 1
