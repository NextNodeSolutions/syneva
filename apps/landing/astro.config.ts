import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

import stylexVite from '@stylexjs/unplugin/vite'

import { linkedPages } from './integrations/linked-pages'

// One root for StyleX's file-based hashes, whatever directory the build runs
// from: markers and variables defined in packages/* keep the same class names.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

// The public site is fully static: every route prerenders to
// dist/<route>/index.html (directory URLs, as the assets host serves them)
// and 404.html. StyleX compiles at build time and appends its atomic CSS to
// the site stylesheet; Motion drives the animations on the client.
export default defineConfig({
	site: 'https://syneva.dev',
	output: 'static',
	build: { format: 'directory', inlineStylesheets: 'never' },
	integrations: [linkedPages()],
	vite: {
		// Keep the global stylesheet's classic max-width queries too (the default
		// target rewrites them into range syntax older Safari ignores).
		build: { cssTarget: ['chrome100', 'firefox100', 'safari15'] },
		plugins: [
			stylexVite({
				unstable_moduleResolution: {
					type: 'commonJS',
					rootDir: REPO_ROOT,
				},
				// Fail the build on an unsupported property instead of silently
				// dropping it (StyleX's default).
				propertyValidationMode: 'throw',
				useCSSLayers: false,
				lightningcssOptions: {
					// Keep classic max-width media queries and unprefixed output
					// readable by every browser the site supports.
					targets: {
						chrome: 100 << 16,
						firefox: 100 << 16,
						safari: 15 << 16,
					},
				},
			}),
		],
	},
})
