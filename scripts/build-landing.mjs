// Assemble the landing deploy bundle for the cloudflare-workers target:
// a static-assets-only Worker (nextnode.toml declares `entry = false` with
// `assets = "dist"`), so the bundle is the site itself plus a static /healthz
// for the pipeline's smoke check - no worker script, nothing to invoke.
//
// The pages are built by the Astro app in apps/landing (part of `turbo run
// build`) as <route>/index.html, so the assets layer serves clean directory
// URLs; this step only moves that build to the repository root, where the
// pipeline reads it.
//
// Run: pnpm build:landing   (part of pnpm build, after turbo run build)
import { access, cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SITE_DIST = path.join(REPO_ROOT, 'apps', 'landing', 'dist')
const DIST_DIR = path.join(REPO_ROOT, 'dist')

// A missing app build would otherwise deploy an empty site with a healthy
// /healthz: fail the build instead.
try {
	await access(path.join(SITE_DIST, 'index.html'))
} catch {
	throw new Error(
		'apps/landing/dist is missing: run `pnpm build` (turbo builds the landing first)',
	)
}

await rm(DIST_DIR, { recursive: true, force: true })
await mkdir(DIST_DIR, { recursive: true })
await cp(SITE_DIST, DIST_DIR, { recursive: true })
await writeFile(path.join(DIST_DIR, 'healthz'), 'ok\n')
const pages = (await readdir(DIST_DIR, { recursive: true })).filter(file =>
	file.endsWith('.html'),
)
// The build is CI's only signal for the landing bundle - a silent pass/fail
// line, not console noise.
process.stdout.write(
	`landing bundle assembled in dist/ (${pages.length} pages)\n`,
)
