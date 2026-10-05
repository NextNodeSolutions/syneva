// Build the desk UI and its chunks (the manifest feeds the bundle budget), and serve the
// same entries from source to the dev loop (apps/syneva/scripts/dev.ts).
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import stylex from '@stylexjs/unplugin/vite'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

import { checkBundleBudget } from './scripts/bundle-budget.mjs'

import type { Plugin, UserConfig } from 'vite'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
// One root for StyleX's file-based hashes, whatever directory the build runs from: markers and
// variables defined in packages/* (the shared @syneva/design-system) keep the class names the
// public site gives them.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UI_ENTRY = fileURLToPath(new URL('./src/app/main.tsx', import.meta.url))
// The hub dashboard: a second, much smaller entry over the same layers (dashboard.js).
const DASHBOARD_ENTRY = fileURLToPath(
	new URL('./src/app/dashboard.tsx', import.meta.url),
)
// Keyed by bundle name: the build emits <name>.js, the page shells load /<name>.js.
const ENTRIES = { ui: UI_ENTRY, dashboard: DASHBOARD_ENTRY }
const OUT_DIR = 'dist'
// Dev only: resolve @syneva/contracts to its TypeScript source (its package exports
// declare this condition), so the dev server needs no built dist and a contract edit
// hot-reloads like any other module.
const SOURCE_CONDITION = '@syneva/source'
const MANIFEST = path.join(OUT_DIR, 'ui-manifest.json')
// The desk's chunk route serves [\w-]+-[A-Za-z0-9]{8}\.js; rollup's base36
// charset (digits + lowercase letters, 8 chars) stays inside that contract.
const CHUNK_HASH_CHARS = 'base36'
// Frontend layer aliases (same map as tsconfig.json's paths). The shared wire
// shapes come from the @syneva/contracts workspace package - no alias needed.
const frontendAliases = {
	'@app': fileURLToPath(new URL('./src/app', import.meta.url)),
	'@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
	'@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
	'@features': fileURLToPath(new URL('./src/features', import.meta.url)),
	'@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
	'@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
}
// StyleX resolves the modules that define markers and variables itself, so it gets the layer
// aliases too, in its own `@layer/*` form.
const stylexAliases = Object.fromEntries(
	Object.entries(frontendAliases).map(([alias, dir]) => [
		`${alias}/*`,
		[`${dir}/*`],
	]),
)

// The one stylesheet both pages link (STATIC_PATHS.styles): StyleX aggregates the rules of
// every module it compiled, whichever entry imports it, into a single CSS asset, so the build
// emits one sheet (cssCodeSplit off) under a fixed name the page shells can name. Any global
// CSS an entry imports lands in it too and reaches both pages: keep such CSS page-neutral (font
// faces, rules scoped under a page's own root class).
const STYLES_FILE = 'styles.css'
// The font faces @syneva/design-system/fonts.css declares, at fixed URLs (fonts/<name>.woff2)
// the hub serves under STATIC_PATHS.fontsPrefix.
const FONTS_DIR = 'fonts'
// Dev only: a shell opts into the stylesheet with this exact link; the dev server swaps it for
// StyleX's live sheet and the shim that refreshes it on every edit.
const STYLES_LINK = `<link rel="stylesheet" href="/${STYLES_FILE}" />`
const DEV_STYLES = [
	'<link rel="stylesheet" href="/virtual:stylex.css" />',
	'<script type="module" src="/@id/virtual:stylex:css-only"></script>',
].join('\n\t\t')

// The oldest browsers the UI's CSS supports, by major version (the public site's floor, see
// apps/landing/astro.config.ts). Vite's CSS pass and StyleX's lightningcss pass both target
// them, so the output keeps classic max-width media queries and stays unprefixed.
const BROWSERS = { chrome: 100, firefox: 100, safari: 15 }
// lightningcss reads a version as major << 16 | minor << 8 | patch.
const MAJOR_SHIFT = 16

// Dev only (`pnpm dev`, where the hub serves the UI through this config's dev server): the
// page shells name the built bundles, which a dev server never emits. Point each shell at
// the source entry its bundle is built from, so Vite serves the module graph with HMR, and
// its stylesheet link at StyleX's live sheet.
const sourceEntriesPlugin = (): Plugin => ({
	name: 'source-entries',
	apply: 'serve',
	transformIndexHtml: {
		order: 'pre',
		handler: (html: string): string =>
			Object.entries(ENTRIES).reduce(
				(page, [name, entry]) =>
					page.replace(
						`src="/${name}.js"`,
						`src="/${path.relative(ROOT, entry)}"`,
					),
				html.replace(STYLES_LINK, DEV_STYLES),
			),
	},
})

// StyleX compiles every module that imports it (the shared design system included) and
// gathers its atomic CSS into the build's stylesheet; under the dev server it serves the same
// rules live at /virtual:stylex.css (sourceEntriesPlugin links it).
const stylexPlugin = (): Plugin[] => {
	const plugin = stylex({
		unstable_moduleResolution: { type: 'commonJS', rootDir: REPO_ROOT },
		aliases: stylexAliases,
		// Fail the build on an unsupported property instead of silently dropping it.
		propertyValidationMode: 'throw',
		useCSSLayers: false,
		// The shells link the sheet themselves (sourceEntriesPlugin), only where they opt in.
		devMode: 'css-only',
		lightningcssOptions: {
			targets: Object.fromEntries(
				Object.entries(BROWSERS).map(([browser, major]) => [
					browser,
					major << MAJOR_SHIFT,
				]),
			),
		},
	})
	return Array.isArray(plugin) ? plugin : [plugin]
}

// Common build options: esbuild parity - no sourcemaps, one minified bundle set.
// NonNullable: UserConfig['build'] is optional on Vite's config, but this helper
// always returns the options object it builds.
const buildOptions = (
	overrides: NonNullable<UserConfig['build']>,
): NonNullable<UserConfig['build']> => ({
	// The build script cleans dist first.
	emptyOutDir: false,
	target: 'es2022',
	outDir: OUT_DIR,
	sourcemap: false,
	minify: true,
	modulePreload: { polyfill: false },
	...overrides,
})

// Emits the manifest in the esbuild-metafile shape and enforces both budget
// gates (initial UI closure, total) so the build fails loudly the way
// build-ui.mjs always did.
const budgetPlugin = (): Plugin => ({
	name: 'ui-bundle-budget',
	apply: 'build',
	writeBundle(_options, bundle) {
		const chunks: { fileName: string; code: string; imports: string[] }[] =
			[]
		for (const [fileName, chunk] of Object.entries(bundle)) {
			if (chunk.type === 'chunk') {
				chunks.push({
					fileName,
					code: chunk.code,
					imports: chunk.imports,
				})
				continue
			}
			// A worker is built apart and lands here as a JS asset: it ships with the UI, so it
			// counts toward the total (never toward the initial closure - nothing imports it).
			if (fileName.endsWith('.js') && typeof chunk.source === 'string')
				chunks.push({ fileName, code: chunk.source, imports: [] })
		}
		// esbuild metafile keys are cwd-relative ('dist/ui.js', 'dist/chunks/…');
		// Vite's are outDir-relative, and an import path can be recorded relative to
		// the importing chunk's directory - resolve both forms against the real keys.
		const keys = new Set(
			chunks.map(chunk => `${OUT_DIR}/${chunk.fileName}`),
		)
		const resolveKey = (dep: string): string => {
			if (keys.has(dep)) return dep
			const dirRelative = `${OUT_DIR}/${dep}`
			if (keys.has(dirRelative)) return dirRelative
			const sameDir = `${OUT_DIR}/chunks/${dep}`
			if (keys.has(sameDir)) return sameDir
			return dirRelative
		}
		const outputs: Record<
			string,
			{
				bytes: number
				imports: { path: string; external: boolean; kind: string }[]
			}
		> = {}
		for (const chunk of chunks) {
			outputs[`${OUT_DIR}/${chunk.fileName}`] = {
				bytes: Buffer.byteLength(chunk.code),
				imports: chunk.imports.map(dep => ({
					path: resolveKey(dep),
					external: false,
					kind: 'import-statement',
				})),
			}
		}
		writeFileSync(MANIFEST, JSON.stringify(outputs))
		checkBundleBudget(outputs, `${OUT_DIR}/ui.js`)
	},
})

export default defineConfig(({ command }) => ({
	// Keep warnings and errors without listing every grammar/theme chunk.
	logLevel: 'warn',
	plugins: [
		budgetPlugin(),
		sourceEntriesPlugin(),
		...stylexPlugin(),
		react(),
	],
	resolve: {
		alias: frontendAliases,
		conditions: [
			...(command === 'serve' ? [SOURCE_CONDITION] : []),
			...defaultClientConditions,
		],
	},
	// @pierre/diffs' highlight worker: an ES module (it lazy-loads the oniguruma wasm), emitted
	// next to the UI chunks under the same name contract the desk's chunk route serves.
	worker: {
		format: 'es',
		rollupOptions: {
			output: {
				entryFileNames: 'chunks/[name]-[hash].js',
				chunkFileNames: 'chunks/[name]-[hash].js',
				hashCharacters: CHUNK_HASH_CHARS,
			},
		},
	},
	// Dev only: transform both entries' module graphs as the server starts. StyleX's live sheet
	// is built from the modules transformed so far, and a variable whose value names a
	// breakpoint (a defineConsts in another file) only resolves once that file is in; a page's
	// first request would otherwise race its own imports.
	server: {
		warmup: { clientFiles: Object.values(ENTRIES) },
	},
	// The dev server pre-bundles dependencies with esbuild; lru_map is @pierre/diffs' one
	// CommonJS dependency, which the browser can only load pre-bundled.
	optimizeDeps: {
		include: ['@pierre/diffs > lru_map'],
		// StyleX's dev transform loads each compiled module's imports (this.load), so a module
		// importing a pre-bundled dependency waits for the optimizer. Held until the crawl ends,
		// the optimizer would wait for that very transform: commit as soon as it has bundled.
		holdUntilCrawlEnd: false,
	},
	build: buildOptions({
		cssCodeSplit: false,
		cssTarget: Object.entries(BROWSERS).map(
			([browser, major]) => `${browser}${major}`,
		),
		rollupOptions: {
			input: ENTRIES,
			output: {
				format: 'es',
				entryFileNames: '[name].js',
				chunkFileNames: 'chunks/[name]-[hash].js',
				// Fixed names for what the page shells and the hub's static routes name.
				assetFileNames: ({ names }) => {
					if (names.some(name => name.endsWith('.css')))
						return STYLES_FILE
					if (names.some(name => name.endsWith('.woff2')))
						return `${FONTS_DIR}/[name][extname]`
					return 'assets/[name]-[hash][extname]'
				},
				hashCharacters: CHUNK_HASH_CHARS,
				// Keep grammar dependencies and theme data out of oversized chunks
				// without changing the language loaders or pulling in their dependencies.
				onlyExplicitManualChunks: true,
				manualChunks(id) {
					if (id.endsWith('/@shikijs/langs/dist/cpp-macro.mjs'))
						return 'cpp-macro'
					const theme = id.match(
						/\/@shikijs\/themes\/dist\/([\w-]+)\.mjs$/,
					)?.[1]
					if (!theme) return undefined
					return `theme-${theme}`
				},
			},
		},
	}),
}))
