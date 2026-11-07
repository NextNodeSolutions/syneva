import type { AstroIntegration } from 'astro'

// astro dev only: the emails as the Worker renders them, through the site's own Vite and StyleX pipeline (the colours come from the design system's compiled tokens), at /_email/<kind> (welcome, already-listed), ?text for the plain body. A build never injects the route.
export function emailPreview(): AstroIntegration {
	return {
		name: 'syneva:email-preview',
		hooks: {
			'astro:config:setup': ({ command, injectRoute }) => {
				if (command !== 'dev') return
				injectRoute({
					pattern: '/_email/[kind]',
					entrypoint: new URL(
						'./email-preview-route.ts',
						import.meta.url,
					),
					prerender: false,
				})
			},
		},
	}
}
