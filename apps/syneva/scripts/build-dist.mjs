import { cpSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Assemble the published dist/: tsdown's clean empties it first; turbo guarantees workspace deps are built beforehand (build dependsOn ^build).
import { build } from 'tsdown'

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const FRONTEND_DIST = path.join(PACKAGE_ROOT, '../../packages/frontend/dist')
const DIST = path.join(PACKAGE_ROOT, 'dist')

await build()

// The asset layout the UI adapter resolves next to the bundled server.
cpSync(FRONTEND_DIST, DIST, { recursive: true })
