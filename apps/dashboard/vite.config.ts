import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import stylex from '@stylexjs/unplugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import LAYERS from './layers.json' with { type: 'json' }

import type { Plugin } from 'vite'

// One root for StyleX's file-based hashes, so the design system's variables keep one name in every front.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const LAYER_DIRECTORIES = Object.fromEntries(
	LAYERS.map(layer => [
		`@${layer}`,
		fileURLToPath(new URL(`./src/${layer}`, import.meta.url)),
	]),
)
const STYLEX_ALIASES = Object.fromEntries(
	Object.entries(LAYER_DIRECTORIES).map(([alias, directory]) => [
		`${alias}/*`,
		[`${directory}/*`],
	]),
)
const BROWSER_FLOOR = { chrome: 120, firefox: 120, safari: 17 }
const MAJOR_SHIFT = 16

// In dev StyleX serves its rules from a virtual stylesheet the page must link itself; a build appends them to the bundle's CSS.
const stylexDevStyles = (): Plugin => ({
	name: 'syneva:stylex-dev-styles',
	apply: 'serve',
	transformIndexHtml: () => [
		{
			tag: 'link',
			attrs: { rel: 'stylesheet', href: '/virtual:stylex.css' },
			injectTo: 'head',
		},
		{
			tag: 'script',
			attrs: { type: 'module', src: '/@id/virtual:stylex:runtime' },
			injectTo: 'head',
		},
	],
})

export default defineConfig({
	plugins: [
		stylexDevStyles(),
		stylex({
			unstable_moduleResolution: { type: 'commonJS', rootDir: REPO_ROOT },
			aliases: STYLEX_ALIASES,
			propertyValidationMode: 'throw',
			useCSSLayers: false,
			lightningcssOptions: {
				targets: Object.fromEntries(
					Object.entries(BROWSER_FLOOR).map(([browser, major]) => [
						browser,
						major << MAJOR_SHIFT,
					]),
				),
			},
		}),
		react(),
		cloudflare({ configPath: './wrangler.dev.jsonc' }),
	],
	resolve: { alias: LAYER_DIRECTORIES },
})
