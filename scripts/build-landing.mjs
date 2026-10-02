// Assemble the landing deploy bundle for the cloudflare-workers target:
// a static-assets-only Worker (nextnode.toml declares `entry = false` with
// `assets = "dist"`), so the bundle is the site itself plus a static /healthz
// for the pipeline's smoke check - no worker script, nothing to invoke.
//
// The pages are rendered here from site/src (one module per route, sharing
// the navigation and footer), then written as <route>/index.html so the
// assets layer serves clean directory URLs.
//
// Run: pnpm build:landing   (part of pnpm build)
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SITE_DIR = path.join(REPO_ROOT, 'site')
const DIST_DIR = path.join(REPO_ROOT, 'dist')
// Authoring material that must not deploy: docs, specs and the page sources.
const EXCLUDED = new Set([
	'.impeccable',
	'AGENTS.md',
	'DESIGN.md',
	'spec.json',
	'navigation-spec.json',
	'src',
])

const { loadPages, outputFile, renderPage } = await import(
	pathToFileURL(path.join(SITE_DIR, 'src', 'site.mjs')).href
)

await rm(DIST_DIR, { recursive: true, force: true })
await mkdir(DIST_DIR, { recursive: true })
await cp(SITE_DIR, DIST_DIR, {
	recursive: true,
	filter: src => !EXCLUDED.has(path.relative(SITE_DIR, src)),
})
const pages = await loadPages()
await Promise.all(
	pages.map(async page => {
		const file = path.join(DIST_DIR, outputFile(page.route))
		await mkdir(path.dirname(file), { recursive: true })
		await writeFile(file, renderPage(page))
	}),
)
await writeFile(path.join(DIST_DIR, 'healthz'), 'ok\n')
// The build is CI's only signal for the landing bundle - a silent pass/fail
// line, not console noise.
process.stdout.write(
	`landing bundle assembled in dist/ (${pages.length} pages)\n`,
)
