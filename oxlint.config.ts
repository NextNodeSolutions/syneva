import standards from '@nextnode-solutions/standards/oxlint'
import { defineConfig } from 'oxlint'

import LANDING_LAYERS from './apps/landing/layers.json' with { type: 'json' }

import type { OxlintOverride } from 'oxlint'

// The layer bans only match aliased imports: these relative spellings close the textual bypass.
const relativeLayerEscapes = (...targets: string[]): string[] =>
	targets.flatMap(target => [
		`../${target}`,
		`../${target}/**`,
		`../../${target}/**`,
		`../../../${target}/**`,
		`../../../../${target}/**`,
	])

const LANDING_SLICED = new Set(['views', 'widgets', 'features', 'entities'])
const LANDING_MOTION_BAN = {
	group: ['motion', 'motion/**'],
	message:
		'the landing animates through @syneva/motion only. Import the engine from @syneva/motion/engine, or export the Motion API you need from it first.',
}
const landingLayer = (layer: string): OxlintOverride => {
	const above = LANDING_LAYERS.slice(0, LANDING_LAYERS.indexOf(layer))
	const others = LANDING_LAYERS.filter(other => other !== layer)
	return {
		files: [`apps/landing/src/${layer}/**/*.{ts,tsx,astro}`],
		rules: {
			'eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						LANDING_MOTION_BAN,
						...(above.length > 0
							? [
									{
										group: above.flatMap(other => [
											`@${other}`,
											`@${other}/**`,
										]),
										message: `${layer} never imports a layer above it (${above.join(', ')}).`,
									},
								]
							: []),
						...(LANDING_SLICED.has(layer)
							? [
									{
										group: [`@${layer}/**`],
										message: `${layer} slices never import each other; intra-slice imports are relative.`,
									},
								]
							: []),
						{
							group: relativeLayerEscapes(...others),
							message:
								'cross-layer imports use the layer aliases. Relative paths must stay inside the slice.',
						},
					],
				},
			],
		},
	}
}

export default defineConfig({
	extends: [standards],
	// Assigning replaces oxlint's built-in list, so node_modules and dist are spelled out.
	ignorePatterns: [
		'node_modules/**',
		'dist/**',
		'.turbo/**',
		'apps/landing/.astro/**',
		'.pi/**',
	],
	overrides: [
		{
			// Drawing and hero figures are data: numbers are coordinates or clock beats.
			files: [
				'apps/landing/src/views/*/ui/art/**',
				'apps/landing/src/views/home/ui/circuit/**',
				'apps/landing/src/shared/ui/drawing/**',
				'apps/landing/src/views/home/ui/hero-choreography.ts',
				'apps/landing/src/views/home/ui/hero-timeline.ts',
				'apps/landing/src/views/home/ui/hero-verdict.ts',
				'apps/landing/src/views/home/ui/Hero{Agent,Card,Desk,Ledger,Stage}.astro',
			],
			rules: { 'eslint/no-magic-numbers': 'off' },
		},
		{
			// The landing copy typesets intended glyphs a visitor reads, never compared as strings.
			files: [
				'apps/landing/src/**/*.astro',
				'apps/landing/src/**/*.tsx',
				'apps/landing/src/features/subscribe/email/welcome-copy.ts',
				'apps/landing/src/features/subscribe/email/already-listed-copy.ts',
				'apps/landing/src/entities/desk/model/agent-contract.ts',
				'apps/landing/src/views/*/ui/art/*.ts',
			],
			rules: { 'nextnode/no-confusable-chars': 'off' },
		},
		{
			// Assigning to context.locals is Astro's middleware contract.
			files: ['apps/landing/src/middleware.ts'],
			rules: { 'eslint/no-param-reassign': 'off' },
		},
		{
			// No Tailwind here: StyleX keyword strings ('fill-box', 'left center') trip the heuristic.
			files: [
				'apps/landing/**',
				'packages/design-system/**',
				'packages/motion/**',
			],
			rules: { 'nextnode/no-detached-tailwind': 'off' },
		},
		{
			files: ['apps/landing/**'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{ patterns: [LANDING_MOTION_BAN] },
				],
			},
		},
		{
			files: ['packages/motion/src/**/*.ts'],
			excludeFiles: ['packages/motion/src/engine.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: ['motion', 'motion/**'],
								message:
									'engine.ts is the one seam of @syneva/motion onto Motion. Import the engine from ./engine, or export the Motion API you need from it first.',
							},
						],
					},
				],
			},
		},
		...LANDING_LAYERS.map(landingLayer),
		{
			// The landing is kept verbatim from the archive; standards 1.27 added this rule after it was written.
			files: [
				'apps/landing/src/widgets/navigation/model/keyboard-order.ts',
				'apps/landing/src/features/subscribe/ui/RowMark.tsx',
			],
			rules: { 'nextnode/prefer-early-return': 'off' },
		},
		{
			// Husky's official CI guard reports husky()'s status on the console.
			files: ['.husky/install.mjs'],
			rules: { 'eslint/no-console': 'off' },
		},
		{
			// The landing Worker's one log boundary: Workers Logs-style JSON.
			files: [
				'apps/landing/src/features/subscribe/model/log-failure.server.ts',
			],
			rules: { 'eslint/no-console': 'off' },
		},
	],
})
