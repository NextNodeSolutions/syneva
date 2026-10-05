// Build the desk UI and its chunks (the manifest feeds the bundle budget), and serve the
// same entries from source to the dev loop (apps/syneva/scripts/dev.ts).
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

import { checkBundleBudget } from './scripts/bundle-budget.mjs'

import type { Plugin, UserConfig } from 'vite'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
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

// @pierre/diffs imports shiki v3's full barrel (`from "shiki"`), which statically
// pulls ~180 grammars + a 607 KB inlined oniguruma wasm. Reroute ONLY @pierre's bare
// `shiki` specifier to a local shim backed by the curated set; Syneva's own deep
// imports keep resolving to the real v4 package. `shiki/wasm` (referenced by
// @pierre's never-taken oniguruma path) resolves to an empty stub.
const shimPath = fileURLToPath(
	new URL('./src/shared/highlighting/shiki-shim.ts', import.meta.url),
)
const fromPierre = (importer: string): boolean =>
	importer.includes('@pierre/diffs')

const shikiShimPlugin = (): Plugin => ({
	name: 'shiki-shim',
	enforce: 'pre',
	resolveId: {
		order: 'pre',
		handler(source: string, importer?: string): string | null {
			if (importer && fromPierre(importer)) {
				if (source === 'shiki') return shimPath
				if (source === 'shiki/wasm') return '\0shiki-wasm-stub'
			}
			return null
		},
	},
	load: {
		order: 'pre',
		handler(id: string): string | undefined {
			if (id === '\0shiki-wasm-stub') return 'export default {};'
			return undefined
		},
	},
})

// Dev only (`pnpm dev`, where the hub serves the UI through this config's dev server): the
// page shells name the built bundles, which a dev server never emits. Point each shell at
// the source entry its bundle is built from, so Vite serves the module graph with HMR.
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
				html,
			),
	},
})

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
			if (chunk.type !== 'chunk') continue
			chunks.push({ fileName, code: chunk.code, imports: chunk.imports })
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
		shikiShimPlugin(),
		budgetPlugin(),
		sourceEntriesPlugin(),
		react(),
	],
	resolve: {
		alias: frontendAliases,
		conditions: [
			...(command === 'serve' ? [SOURCE_CONDITION] : []),
			...defaultClientConditions,
		],
	},
	// The dev server pre-bundles dependencies with esbuild, which resolves a
	// dependency's own imports without this config's plugins: pre-bundled,
	// @pierre/diffs would get the full shiki barrel instead of the shim an install
	// ships. Left out, it is served file by file through shikiShimPlugin. lru_map is
	// its one CommonJS dependency, which the browser can only load pre-bundled.
	optimizeDeps: {
		exclude: ['@pierre/diffs'],
		include: ['@pierre/diffs > lru_map'],
	},
	build: buildOptions({
		rollupOptions: {
			input: ENTRIES,
			output: {
				format: 'es',
				entryFileNames: '[name].js',
				chunkFileNames: 'chunks/[name]-[hash].js',
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
