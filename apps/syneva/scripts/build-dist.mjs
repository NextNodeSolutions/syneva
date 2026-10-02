import { cpSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Assemble the publishable package's dist/: run the tsdown bundle (config in
// tsdown.config.ts - the CLI bin and the bridge module the pi extension
// imports; harness peers stay external), then copy the built UI assets next
// to them. tsdown's clean empties dist first, so no stale artifacts survive
// into the packed package (the backend and frontend packages clean their own
// dist the same way).
//
// turbo guarantees the workspace dependencies are built before this runs
// (build dependsOn ^build). Run: pnpm --filter syneva build
import { build } from 'tsdown'

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const FRONTEND_DIST = path.join(PACKAGE_ROOT, '../../packages/frontend/dist')
const DIST = path.join(PACKAGE_ROOT, 'dist')

await build()

// ui.js, chunks/, ui-manifest.json and index.html - the layout the assets
// adapter resolves next to the bundled server.
cpSync(FRONTEND_DIST, DIST, { recursive: true })
