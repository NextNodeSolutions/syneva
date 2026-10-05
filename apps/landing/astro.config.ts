import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

import cloudflare from '@astrojs/cloudflare'
import stylexVite from '@stylexjs/unplugin/vite'

import { linkedPages } from './integrations/linked-pages'
import LAYERS from './layers.json' with { type: 'json' }
import { SITE_URL } from './src/entities/site/model/site-map'

// One root for StyleX's file-based hashes, whatever directory the build runs
// from: markers and variables defined in packages/* keep the same class names.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SRC = fileURLToPath(new URL('./src', import.meta.url))
// StyleX resolves the modules that define markers and variables itself, so
// it gets the FSD layer aliases too (tsconfig.json declares them for
// TypeScript and Vite).
const STYLEX_ALIASES = Object.fromEntries(
	LAYERS.map(layer => [`@${layer}/*`, [`${SRC}/${layer}/*`]]),
)

// The oldest browsers the site supports, by major version. Both CSS passes
// target them, so the output keeps classic max-width media queries (the
// default target rewrites them into range syntax older Safari ignores) and
// stays unprefixed.
const BROWSERS = { chrome: 100, firefox: 100, safari: 15 }
// lightningcss reads a version as major << 16 | minor << 8 | patch.
const MAJOR_SHIFT = 16

// The public site is static but for one route: every page prerenders to
// dist/client/<route>/index.html (directory URLs, as the assets host serves
// them) and 404.html, and the newsletter signup (src/pages/api/subscribe.ts)
// runs on demand in the Worker the adapter builds at dist/server/entry.mjs.
// StyleX compiles at build time and appends its atomic CSS to the site
// stylesheet; Motion drives the animations on the client.
export default defineConfig({
	site: SITE_URL,
	output: 'static',
	// The Worker the site deploys as. Images are optimised at build (no Images
	// binding to provision); `astro dev` reads its local bindings from
	// wrangler.dev.jsonc.
	adapter: cloudflare({
		imageService: 'compile',
		configPath: 'wrangler.dev.jsonc',
	}),
	build: { format: 'directory', inlineStylesheets: 'never' },
	integrations: [linkedPages()],
	vite: {
		build: {
			cssTarget: Object.entries(BROWSERS).map(
				([browser, major]) => `${browser}${major}`,
			),
		},
		plugins: [
			stylexVite({
				unstable_moduleResolution: {
					type: 'commonJS',
					rootDir: REPO_ROOT,
				},
				aliases: STYLEX_ALIASES,
				// Fail the build on an unsupported property instead of silently
				// dropping it (StyleX's default).
				propertyValidationMode: 'throw',
				useCSSLayers: false,
				lightningcssOptions: {
					targets: Object.fromEntries(
						Object.entries(BROWSERS).map(([browser, major]) => [
							browser,
							major << MAJOR_SHIFT,
						]),
					),
				},
			}),
		],
	},
})
