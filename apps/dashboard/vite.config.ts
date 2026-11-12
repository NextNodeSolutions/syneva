import { globSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import stylex from '@stylexjs/unplugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import LAYERS from './layers.json' with { type: 'json' }

import type { Connect, Plugin } from 'vite'

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
const STYLEX_STYLESHEET = '/virtual:stylex.css'
const STYLEX_CONST_MODULES = globSync(
	[
		'packages/design-system/src/*.stylex.ts',
		'apps/dashboard/src/**/*.stylex.ts',
	],
	{ cwd: REPO_ROOT },
).map(file => `/@fs${join(REPO_ROOT, file)}`)

// In dev StyleX serves its rules from a virtual stylesheet the page must link itself; a build appends them to the bundle's CSS.
const stylexDevStyles = (): Plugin => ({
	name: 'syneva:stylex-dev-styles',
	apply: 'serve',
	enforce: 'pre',
	configureServer: server => {
		const collectConstModules = async (
			next: Connect.NextFunction,
		): Promise<void> => {
			try {
				await Promise.all(
					STYLEX_CONST_MODULES.map(url =>
						server.environments.client.transformRequest(url),
					),
				)
			} catch (error) {
				next(error)
				return
			}
			next()
		}
		server.middlewares.use((request, _response, next) => {
			if (!request.url?.startsWith(STYLEX_STYLESHEET)) {
				next()
				return
			}
			void collectConstModules(next)
		})
	},
	transformIndexHtml: () => [
		{
			tag: 'link',
			attrs: { rel: 'stylesheet', href: STYLEX_STYLESHEET },
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
		cloudflare({
			configPath: './wrangler.dev.jsonc',
			viteEnvironment: { name: 'server' },
		}),
	],
	environments: { server: { build: { outDir: 'dist/server' } } },
	server: { port: 5173, strictPort: true },
	resolve: { alias: LAYER_DIRECTORIES },
})
