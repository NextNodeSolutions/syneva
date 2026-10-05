// The dev loop's composition root: the hub from source, its UI served by a Vite dev
// server on the hub's own origin - same port, same /d/<id>/ URLs, same guards as an
// install - so nothing is built and the pages get HMR. `node --watch` restarts the whole
// process on a backend or contracts change: the hub restores its desks, open tabs reload.
//
// Run: pnpm dev   (trailing flags reach `syneva start`: pnpm dev --port 4800)
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
// Where the page shells the build copies into dist live as source.
const PAGE_SHELLS = path.join(FRONTEND_ROOT, 'src/app')
const LOOPBACK = '127.0.0.1'
const HTTP_OK = 200
// process.argv is [node, script, ...userArgs].
const USER_ARG_START_INDEX = 2

// A page shell read from source on every request (an edit shows on reload), with the
// source entry and the HMR client swapped in by Vite (vite.config.ts, sourceEntriesPlugin).
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

// Vite answers what belongs to its module graph and calls next() for the rest. A response
// it ends never reaches next(), so the close of the response is the "answered" signal.
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

// Running from source reports version 0.0.0: every start would offer the "update".
process.env.SYNEVA_NO_UPDATE_CHECK = '1'

// Ctrl-C ends a dev session, it does not fail one: left as the hub's signal status, the
// exit would make pnpm report a failed script.
process.on('exit', code => {
	if (code === SIGNAL_EXIT_CODE) process.exitCode = 0
})

const vite = await createServer({
	root: FRONTEND_ROOT,
	appType: 'custom',
	// Import vite.config.ts through this process's own loader (tsx), so the watcher tracks
	// it like any other source file. The default loader bundles it to a temp module that
	// appears and vanishes on every start, which the watcher answers with a restart - a loop.
	configLoader: 'native',
	// Vite clears the terminal before each HMR line, which would wipe the hub's own
	// output - the URL it announced, the desks it opened.
	clearScreen: false,
	// The hub's server is the origin; Vite only keeps its HMR socket, held on loopback like
	// a standalone dev server would be.
	server: { middlewareMode: true, hmr: { host: LOOPBACK } },
})

// --no-open: a watch restart must not pop a new dashboard tab; the URL is announced.
await runStart(
	parseArgs(['--no-open', ...process.argv.slice(USER_ARG_START_INDEX)]),
	viteUi(vite),
)

// runStart holds the process for as long as the hub serves. Returning means it never bound
// and said why - usually the machine's own hub already answers on the port.
process.stderr.write(
	'The dev hub did not start. If another hub holds the port, stop it with `syneva hub stop` (its desks are restored here) and rerun `pnpm dev`.\n',
)
await vite.close()
process.exitCode = 1
