// Assembles dist/ the way wrangler.jsonc and a deploy read it: dist/server/entry.mjs, the Worker
// and its object in one bundle, and dist/client, the frontend's build served as static assets.
// turbo builds @syneva/contracts and @syneva/frontend first (build dependsOn ^build).
import { cpSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import baseConfig from '@nextnode-solutions/standards/tsdown'
import { build } from 'tsdown'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DIST = path.join(ROOT, 'dist')
const CLIENT = path.join(DIST, 'client')
const FRONTEND_DIST = path.join(ROOT, '../../packages/frontend/dist')
const SYNEVA_PACKAGE = path.join(ROOT, '../syneva/package.json')

// Where the two page shells go: out of the way of every page path. The asset layer answers a path
// that names a file before the Worker runs (always, under a config without run_worker_first, as
// the pipeline's), so `/` must never match index.html nor `/dashboard` dashboard.html; the Worker
// fetches them from here (src/routes/shells.ts), by their extensionless name, which the asset
// layer's default html_handling serves.
const SHELLS = [
	['index.html', '_shell/desk.html'],
	['dashboard.html', '_shell/dashboard.html'],
]

// The build's identity, baked in: the health route's instanceId and startedAt name the
// deployment, as a local hub's name its process (RFC 4.7); version is the CLI's.
const builtAt = new Date().toISOString()
const { version } = JSON.parse(readFileSync(SYNEVA_PACKAGE, 'utf8'))

rmSync(DIST, { recursive: true, force: true })
await build({
	...baseConfig,
	config: false,
	cwd: ROOT,
	entry: { entry: 'src/worker.ts' },
	outDir: path.join(DIST, 'server'),
	platform: 'neutral',
	fixedExtension: true,
	dts: false,
	logLevel: 'warn',
	// @syneva/contracts is inlined from its built dist; the runtime's own module stays an import,
	// the only one the bundle may keep (scripts/bundle-check.mjs, RFC 6.3 R12).
	deps: {
		alwaysBundle: [/^@syneva\/contracts/],
		neverBundle: ['cloudflare:workers'],
	},
	define: {
		SYNEVA_VERSION: JSON.stringify(version),
		SYNEVA_BUILD_ID: JSON.stringify(
			process.env.GITHUB_SHA ?? `local-${builtAt}`,
		),
		SYNEVA_BUILT_AT: JSON.stringify(builtAt),
	},
})

cpSync(FRONTEND_DIST, CLIENT, { recursive: true })
for (const [from, to] of SHELLS) {
	mkdirSync(path.dirname(path.join(CLIENT, to)), { recursive: true })
	renameSync(path.join(CLIENT, from), path.join(CLIENT, to))
}
