import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import stylexVite from '@stylexjs/unplugin/vite'

import { devCache } from './integrations/dev-cache'
import { linkedPages } from './integrations/linked-pages'
import LAYERS from './layers.json' with { type: 'json' }
import { SITE_URL } from './src/entities/site/model/site-map'

// One StyleX root, so marker and variable modules defined in packages/* keep their class names at any build directory.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SRC = fileURLToPath(new URL('./src', import.meta.url))
// StyleX resolves marker/variable modules itself, so it needs the FSD layer aliases too.
const STYLEX_ALIASES = Object.fromEntries(
	LAYERS.map(layer => [`@${layer}/*`, [`${SRC}/${layer}/*`]]),
)

// Both CSS passes target this floor: classic max-width media queries (the default target's range syntax breaks older Safari) and no prefixes.
const BROWSERS = { chrome: 100, firefox: 100, safari: 15 }
// lightningcss packs a version as major << 16 | minor << 8 | patch.
const MAJOR_SHIFT = 16

export default defineConfig({
	site: SITE_URL,
	output: 'static',
	adapter: cloudflare({
		imageService: 'compile',
		configPath: 'wrangler.dev.jsonc',
	}),
	build: { format: 'directory', inlineStylesheets: 'never' },
	// React renders the signup's islands (src/features/subscribe/ui/*.tsx); everything else stays plain Astro.
	integrations: [react(), linkedPages(), devCache()],
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
