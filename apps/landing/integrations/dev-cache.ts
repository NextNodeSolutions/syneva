import type { AstroIntegration } from 'astro'

// Relative to the app's root, beside Vite's default node_modules/.vite.
const DEV_CACHE_DIR = 'node_modules/.vite-dev'

// `astro dev` keeps its own Vite cache. `astro check` and `astro build`
// re-optimise the shared one (node_modules/.vite, its deps, deps_ssr and
// deps_astro), and a dev server whose optimised dependencies vanish under it
// answers 404s for the site's scripts and 500s for its pages until restarted.
export function devCache(): AstroIntegration {
	return {
		name: 'syneva:dev-cache',
		hooks: {
			'astro:config:setup': ({ command, updateConfig }) => {
				if (command !== 'dev') return
				updateConfig({ vite: { cacheDir: DEV_CACHE_DIR } })
			},
		},
	}
}
