import { cpSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Assemble the publishable package's dist/: bundle the backend (with
// @syneva/contracts inlined; the harness peers stay external) into the two
// entry points the package needs - the CLI bin and the bridge module the pi
// extension imports - then copy the built UI assets next to them.
//
// turbo guarantees the workspace dependencies are built before this runs
// (build dependsOn ^build). Run: pnpm --filter syneva build
import { build } from 'esbuild'

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BACKEND_SRC = path.join(PACKAGE_ROOT, '../../packages/backend/src')
const FRONTEND_DIST = path.join(PACKAGE_ROOT, '../../packages/frontend/dist')
const DIST = path.join(PACKAGE_ROOT, 'dist')

// The published package ships the whole of dist (see "files" in package.json),
// so every build must start from an empty dist: leftover artifacts from an
// earlier build layout would otherwise survive and be packed. The backend and
// frontend packages clean their own dist the same way.
rmSync(DIST, { recursive: true, force: true })

await build({
	entryPoints: [
		{ in: path.join(BACKEND_SRC, 'bootstrap/cli.ts'), out: 'cli' },
		{
			in: path.join(BACKEND_SRC, 'adapters/inbound/pi/pi-bridge.ts'),
			out: 'pi-bridge',
		},
	],
	outdir: DIST,
	bundle: true,
	platform: 'node',
	target: 'node22',
	format: 'esm',
	sourcemap: false,
	minify: false,
	// Harness-provided peers (see peerDependencies): resolved at runtime from the
	// host install, never bundled.
	external: ['@earendil-works/pi-coding-agent', 'typebox'],
	logLevel: 'info',
})

// ui.js, chunks/, ui-manifest.json and index.html - the layout the assets
// adapter resolves next to the bundled server.
cpSync(FRONTEND_DIST, DIST, { recursive: true })
