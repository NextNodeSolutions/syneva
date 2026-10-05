// Build the desk UI and its chunks. The manifest feeds the bundle budget.
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { checkBundleBudget } from './scripts/bundle-budget.mjs'

import type { Plugin, UserConfig } from 'vite'

const UI_ENTRY = fileURLToPath(new URL('./src/app/main.tsx', import.meta.url))
// `pnpm dev` overrides this so the watch rebuild lands straight in the served
// apps/syneva/dist instead of this package's own dist.
const OUT_DIR = process.env.SYNEVA_UI_OUT_DIR ?? 'dist'
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

// Common build options: esbuild parity - no sourcemaps, one minified bundle set.
// NonNullable: UserConfig['build'] is optional on Vite's config, but this helper
// always returns the options object it builds.
const buildOptions = (
	overrides: NonNullable<UserConfig['build']>,
): NonNullable<UserConfig['build']> => ({
	// The build script cleans dist first; the dev watch must never empty the
	// assembled apps/syneva/dist it writes into (outDir outside root forbids it).
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

export default defineConfig({
	plugins: [budgetPlugin(), react()],
	resolve: {
		alias: frontendAliases,
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
