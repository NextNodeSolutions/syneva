// Dev loop for the published package: assemble a servable dist once, then
// watch both worlds - the backend runs from source via tsx (fast restarts,
// @syneva/contracts resolves through its built dist), the frontend rebuilds
// straight into apps/syneva/dist via vite --watch.
//
// Run: pnpm --filter syneva dev   (or `pnpm dev` at the workspace root)
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const REPO_ROOT = path.join(PACKAGE_ROOT, '../..')
const BACKEND_CLI = path.join(
	REPO_ROOT,
	'packages/backend/src/bootstrap/cli.ts',
)
const FRONTEND_DIR = path.join(REPO_ROOT, 'packages/frontend')

// Build the workspace dependencies once (contracts is resolved from its built
// dist by tsx; the assembled dist needs the frontend's built assets).
const deps = spawnSync('pnpm', ['exec', 'turbo', 'run', 'build'], {
	cwd: REPO_ROOT,
	stdio: 'inherit',
})
if (deps.status !== 0) process.exit(deps.status ?? 1)

// First assembly: bundle the server + bridge and copy the UI assets, so the
// desk serves a complete dist before either watcher is up.
const assemble = spawnSync('node', ['scripts/build-dist.mjs'], {
	cwd: PACKAGE_ROOT,
	stdio: 'inherit',
})
if (assemble.status !== 0) process.exit(assemble.status ?? 1)

const children = [
	// Backend from source; cwd stays this package so the assets adapter's
	// process.cwd()/dist fallback resolves the assembled UI.
	spawn('pnpm', ['exec', 'tsx', 'watch', BACKEND_CLI], {
		cwd: PACKAGE_ROOT,
		stdio: 'inherit',
	}),
	// Frontend watch rebuilds directly into the served dist.
	spawn('pnpm', ['exec', 'vite', 'build', '--watch'], {
		cwd: FRONTEND_DIR,
		stdio: 'inherit',
		env: {
			...process.env,
			SYNEVA_UI_OUT_DIR: path.join(PACKAGE_ROOT, 'dist'),
		},
	}),
]

const stop = () => {
	for (const child of children) child.kill('SIGTERM')
	process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
for (const child of children)
	child.on('exit', code => {
		if (code !== 0 && code !== null) stop()
	})
