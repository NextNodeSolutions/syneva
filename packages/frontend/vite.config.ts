import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import stylex from '@stylexjs/unplugin/vite'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

import { checkBundleBudget } from './scripts/bundle-budget.mjs'

import type { Plugin, UserConfig } from 'vite'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
// One root for StyleX's file-based hashes, so markers/variables defined in packages/* keep their class names.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UI_ENTRY = fileURLToPath(new URL('./src/app/main.tsx', import.meta.url))
const DASHBOARD_ENTRY = fileURLToPath(
	new URL('./src/app/dashboard.tsx', import.meta.url),
)
const ENTRIES = { ui: UI_ENTRY, dashboard: DASHBOARD_ENTRY }
const OUT_DIR = 'dist'
const SOURCE_CONDITION = '@syneva/source'
const MANIFEST = path.join(OUT_DIR, 'ui-manifest.json')
// base36 stays inside the desk chunk route's [\w-]+-[A-Za-z0-9]{8}\.js pattern.
const CHUNK_HASH_CHARS = 'base36'
const frontendAliases = {
	'@app': fileURLToPath(new URL('./src/app', import.meta.url)),
	'@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
	'@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
	'@features': fileURLToPath(new URL('./src/features', import.meta.url)),
	'@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
	'@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
}
const stylexAliases = Object.fromEntries(
	Object.entries(frontendAliases).map(([alias, dir]) => [
		`${alias}/*`,
		[`${dir}/*`],
	]),
)

// StyleX aggregates every compiled module's rules into the ONE stylesheet both pages link; global CSS an entry import reaches both pages, so keep such CSS page-neutral.
const STYLES_FILE = 'styles.css'
const FONTS_DIR = 'fonts'
const STYLES_LINK = `<link rel="stylesheet" href="/${STYLES_FILE}" />`
const DEV_STYLES = [
	'<link rel="stylesheet" href="/virtual:stylex.css" />',
	'<script type="module" src="/@id/virtual:stylex:css-only"></script>',
].join('\n\t\t')

const BROWSERS = { chrome: 100, firefox: 100, safari: 15 }
const MAJOR_SHIFT = 16

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

const stylexPlugin = (): Plugin[] => {
	const plugin = stylex({
		unstable_moduleResolution: { type: 'commonJS', rootDir: REPO_ROOT },
		aliases: stylexAliases,
		propertyValidationMode: 'throw',
		useCSSLayers: false,
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

const buildOptions = (
	overrides: NonNullable<UserConfig['build']>,
): NonNullable<UserConfig['build']> => ({
	emptyOutDir: false,
	target: 'es2022',
	outDir: OUT_DIR,
	sourcemap: false,
	minify: true,
	modulePreload: { polyfill: false },
	...overrides,
})

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
			// Ships with the UI, counts toward the total, never toward the initial closure (nothing imports it).
			if (fileName.endsWith('.js') && typeof chunk.source === 'string')
				chunks.push({ fileName, code: chunk.source, imports: [] })
		}
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
	server: {
		warmup: { clientFiles: Object.values(ENTRIES) },
	},
	optimizeDeps: {
		include: ['@pierre/diffs > lru_map'],
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
				assetFileNames: ({ names }) => {
					if (names.some(name => name.endsWith('.css')))
						return STYLES_FILE
					if (names.some(name => name.endsWith('.woff2')))
						return `${FONTS_DIR}/[name][extname]`
					return 'assets/[name]-[hash][extname]'
				},
				hashCharacters: CHUNK_HASH_CHARS,
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
