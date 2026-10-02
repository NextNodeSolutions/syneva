// Assemble the landing deploy bundle for the cloudflare-workers target:
// a static-assets-only Worker (nextnode.toml declares `entry = false` with
// `assets = "dist"`), so the bundle is the site itself plus a static /healthz
// for the pipeline's smoke check - no worker script, nothing to invoke.
//
// Run: pnpm build:landing   (part of pnpm build)
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SITE_DIR = path.join(REPO_ROOT, 'site')
const DIST_DIR = path.join(REPO_ROOT, 'dist')

await rm(DIST_DIR, { recursive: true, force: true })
await mkdir(DIST_DIR, { recursive: true })
// Ship the site content only - the site/ folder also carries authoring docs
// (.impeccable, AGENTS.md, DESIGN.md) that must not deploy.
await cp(SITE_DIR, DIST_DIR, {
	recursive: true,
	filter: src => {
		const rel = path.relative(SITE_DIR, src)
		return !['.impeccable', 'AGENTS.md', 'DESIGN.md'].includes(rel)
	},
})
await writeFile(path.join(DIST_DIR, 'healthz'), 'ok\n')
// The build is CI's only signal for the landing bundle - a silent pass/fail
// line, not console noise.
process.stdout.write('landing bundle assembled in dist/\n')
