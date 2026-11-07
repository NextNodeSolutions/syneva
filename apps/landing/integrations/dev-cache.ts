import type { AstroIntegration } from 'astro'

const DEV_CACHE_DIR = 'node_modules/.vite-dev'

// astro dev needs its own Vite cache: astro check/build re-optimise the shared node_modules/.vite, and a dev server whose optimised deps vanish answers 404s/500s until restarted.
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
