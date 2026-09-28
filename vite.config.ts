// Build the desk UI and its chunks. The manifest feeds the bundle budget.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { checkBundleBudget } from './scripts/bundle-budget.mjs'

import type { Plugin, UserConfig } from 'vite'

const UI_ENTRY = fileURLToPath(
	new URL('./src/frontend/app/main.tsx', import.meta.url),
)
const UI_BUNDLE = 'dist/ui.js'
const MANIFEST = 'dist/ui-manifest.json'
// The desk's chunk route serves [\w-]+-[A-Za-z0-9]{8}\.js; rollup's base36
// charset (digits + lowercase letters, 8 chars) stays inside that contract.
const CHUNK_HASH_CHARS = 'base36'
// Frontend layer aliases (same map as tsconfig.json's paths; @contracts sinks to src/contracts).
const frontendAliases = {
	'@app': fileURLToPath(new URL('./src/frontend/app', import.meta.url)),
	'@pages': fileURLToPath(new URL('./src/frontend/pages', import.meta.url)),
	'@widgets': fileURLToPath(
		new URL('./src/frontend/widgets', import.meta.url),
	),
	'@features': fileURLToPath(
		new URL('./src/frontend/features', import.meta.url),
	),
	'@entities': fileURLToPath(
		new URL('./src/frontend/entities', import.meta.url),
	),
	'@shared': fileURLToPath(new URL('./src/frontend/shared', import.meta.url)),
	'@contracts': fileURLToPath(new URL('./src/contracts', import.meta.url)),
}

// @pierre/diffs imports shiki v3's full barrel (`from "shiki"`), which statically
// pulls ~180 grammars + a 607 KB inlined oniguruma wasm. Reroute ONLY @pierre's bare
// `shiki` specifier to a local shim backed by the curated set; Syneva's own deep
// imports keep resolving to the real v4 package. `shiki/wasm` (referenced by
// @pierre's never-taken oniguruma path) resolves to an empty stub.
const shimPath = fileURLToPath(
	new URL(
		'./src/frontend/shared/highlighting/shiki-shim.ts',
		import.meta.url,
	),
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

// Common build options: esbuild parity - no sourcemaps, one minified bundle set.
const buildOptions = (overrides: UserConfig['build']): UserConfig['build'] => ({
	// dist also holds the compiled backend (tsc runs first in `pnpm build`).
	emptyOutDir: false,
	target: 'es2022',
	outDir: 'dist',
	sourcemap: false,
	minify: true,
	modulePreload: { polyfill: false },
	...overrides,
})

// Emits dist/ui-manifest.json in the esbuild-metafile shape and enforces both
// budget gates (initial UI closure, total) so the build fails loudly the way
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
		const keys = new Set(chunks.map(chunk => `dist/${chunk.fileName}`))
		const resolveKey = (path: string): string => {
			if (keys.has(path)) return path
			const rootRelative = `dist/${path}`
			if (keys.has(rootRelative)) return rootRelative
			const sameDir = `dist/chunks/${path}`
			if (keys.has(sameDir)) return sameDir
			return rootRelative
		}
		const outputs: Record<
			string,
			{
				bytes: number
				imports: { path: string; external: boolean; kind: string }[]
			}
		> = {}
		for (const chunk of chunks) {
			outputs[`dist/${chunk.fileName}`] = {
				bytes: Buffer.byteLength(chunk.code),
				imports: chunk.imports.map(path => ({
					path: resolveKey(path),
					external: false,
					kind: 'import-statement',
				})),
			}
		}
		writeFileSync(MANIFEST, JSON.stringify(outputs))
		checkBundleBudget(outputs, UI_BUNDLE)
	},
})

export default defineConfig({
	plugins: [shikiShimPlugin(), budgetPlugin(), react()],
	resolve: {
		alias: frontendAliases,
	},
	build: buildOptions({
		rollupOptions: {
			input: { ui: UI_ENTRY },
			output: {
				format: 'es',
				entryFileNames: '[name].js',
				chunkFileNames: 'chunks/[name]-[hash].js',
				hashCharacters: CHUNK_HASH_CHARS,
			},
		},
	}),
})
