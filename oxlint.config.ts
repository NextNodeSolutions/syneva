import standards from '@nextnode-solutions/standards/oxlint'
import { defineConfig } from 'oxlint'

import LANDING_LAYERS from './apps/landing/layers.json' with { type: 'json' }

import type { OxlintOverride } from 'oxlint'

// The layer bans only match aliased imports: these relative spellings close the textual bypass, and the enumerated climbs reach the deepest current nesting.
const relativeLayerEscapes = (...targets: string[]): string[] =>
	targets.flatMap(target => [
		`../${target}`,
		`../${target}/**`,
		`../../${target}/**`,
		`../../../${target}/**`,
		`../../../../${target}/**`,
	])

// Core runs in the user's Durable Object as well as under node:http (RFC 0001, 3.1): node:path and node:crypto (both in nodejs_compat) are its only Node modules, @syneva/contracts and core itself its only imports.
const CORE_IMPORT_BANS = [
	{
		group: [
			'fs',
			'node:fs',
			'fs/promises',
			'node:fs/promises',
			'http',
			'node:http',
			'https',
			'node:https',
			'net',
			'node:net',
			'child_process',
			'node:child_process',
			'os',
			'node:os',
			'process',
			'node:process',
			'worker_threads',
			'node:worker_threads',
			'ws',
			'oxc-parser',
			'@syneva/local',
			'@syneva/local/**',
			'@syneva/frontend',
			'@syneva/frontend/**',
		],
		message:
			"core runs in the user's Durable Object (RFC 0001, 3.1): its only Node modules are node:path and node:crypto, its only imports @syneva/contracts and core. Put the Node API behind a port local implements.",
	},
]

// A timer keeps the object hibernation-ineligible, so billed while it waits (RFC 0001, 6.1 W4); the Node globals do not exist there at all.
const CORE_GLOBAL_BANS = [
	...[
		'setTimeout',
		'setInterval',
		'setImmediate',
		'clearTimeout',
		'clearInterval',
	].map(name => ({
		name,
		message:
			'a timer in core keeps the object awake and billed (RFC 0001, 6.1 W4): grace periods and TTLs are deadlines compared on the next read; a timer that must fire belongs to local.',
	})),
	...['process', 'Buffer', '__dirname', '__filename', 'require'].map(
		name => ({
			name,
			message:
				"core runs in the user's Durable Object (RFC 0001, 3.1): no Node global there. Take the value from the composition root, or encode with TextEncoder and Uint8Array.",
		}),
	),
]

// apps/web's Worker runs per request and its UserHub object hibernates between frames (RFC 0001, 6.1 W4, 6.3 R2, R4): a timer anywhere in the bundle keeps an object awake and billed, so none is written; a grace period is a deadline compared on the next event.
const WEB_TIMER_BANS = [
	'setTimeout',
	'setInterval',
	'setImmediate',
	'clearTimeout',
	'clearInterval',
	'queueMicrotask',
].map(name => ({
	name,
	message:
		'no timer in apps/web (RFC 0001, 6.1 W4, 6.3 R2): it keeps the object awake and billed. Compare a deadline on the next event; an outbound call takes AbortSignal.timeout.',
}))

const WEB_IMPORT_BANS = {
	group: [
		'@syneva/local',
		'@syneva/local/**',
		'@syneva/frontend',
		'@syneva/frontend/**',
	],
	message:
		'apps/web runs on Workers: it never imports the Node side (local) or the browser (frontend); their wire shapes are in @syneva/contracts.',
}

// The object (apps/web/src/bridge) is a switchboard that stores nothing and never calls out (RFC 0001, 6.3 R2-R4, R12): no fetch, no stream but the relay's, no storage, alarm or concurrency block, never a non-hibernating accept; its only imports are contracts, the runtime and its own folder.
const BRIDGE_GLOBAL_BANS = [
	...WEB_TIMER_BANS,
	{
		name: 'fetch',
		message:
			'the object makes no outbound call (RFC 0001, 6.3 R4): fetch, D1 and email belong to the Worker, which hands the object what it needs with the request.',
	},
]
const BRIDGE_STREAM_BANS = [
	'ReadableStream',
	'WritableStream',
	'TransformStream',
].map(name => ({
	name,
	message:
		'only bridge/relay.ts opens a stream (RFC 0001, 6.3 R5): the relay is the one bounded streaming response.',
}))
const BRIDGE_PROPERTY_BANS = [
	[
		'storage',
		'the object never stores (RFC 0001, 6.3 R2): the paired hub is the truth.',
	],
	[
		'setAlarm',
		'no alarm (RFC 0001, 6.3 R2): an alarm wakes and bills the object.',
	],
	[
		'blockConcurrencyWhile',
		'no concurrency block (RFC 0001, 6.3 R2): the object holds no state to guard.',
	],
	[
		'waitUntil',
		'nothing outlives an event in the object (RFC 0001, 6.3 R2): work after the answer keeps it awake.',
	],
	[
		'accept',
		'ctx.acceptWebSocket only (RFC 0001, 6.3 R1): ws.accept() is never hibernatable.',
	],
].map(([property, message]) => ({ property, message }))
const BRIDGE_IMPORT_BANS = {
	group: ['**', '!@syneva/contracts/**', '!cloudflare:workers', '!./*'],
	message:
		'the object imports @syneva/contracts, cloudflare:workers and its own folder only (RFC 0001, 6.3 R12): bridge/internal.ts is what it shares with the Worker.',
}

// Layers run in layers.json order; sliced layers also ban their own alias (intra-slice imports are relative); the rules cover .astro frontmatter/scripts and the React islands (.tsx) too.
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
	// Assigning replaces oxlint's built-in list: node_modules/dist and the generated/runtime artifacts are spelled out.
	ignorePatterns: [
		'node_modules/**',
		'dist/**',
		'.turbo/**',
		// GENERATED by scripts/fetch-icons.mjs.
		'packages/frontend/src/shared/ui/icon-data.ts',
		// GENERATED by Astro.
		'apps/landing/.astro/**',
		'.desk/**',
		'.pi/**',
		'.prd/**',
		'prototypes/**',
		'.playwright-mcp/**',
	],
	overrides: [
		{
			// The drawing/hero figures are data: numbers are coordinates or clock beats, not values to name.
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
			// The landing's copy typesets intended glyphs a visitor reads (never compared as strings): its components, Astro and React (the signup's islands and emails), and these copy modules.
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
			// Assigning to context.locals is Astro's middleware contract, not a param reassignment.
			files: ['apps/landing/src/middleware.ts'],
			rules: { 'eslint/no-param-reassign': 'off' },
		},
		{
			// No Tailwind anywhere; StyleX/DOM keyword strings ('fill-box', 'left center') only look like utility classes to the heuristic.
			files: [
				'apps/landing/**',
				'packages/design-system/**',
				'packages/frontend/**',
				'packages/motion/**',
			],
			rules: { 'nextnode/no-detached-tailwind': 'off' },
		},
		{
			// Unassigned import: CSS is loaded for its side effect (the font faces land in the linked stylesheet).
			files: ['packages/frontend/src/app/*.tsx'],
			rules: {
				'import/no-unassigned-import': [
					'warn',
					{ allow: ['**/*.css'] },
				],
			},
		},
		{
			// A mechanical translation of @pierre's resolveRegion cursor walk: splitting it would scatter the one lockstep-ledger invariant.
			files: ['packages/frontend/src/shared/diff-renderer/distill.ts'],
			rules: {
				'eslint/max-lines-per-function': 'off',
				'eslint/max-depth': 'off',
			},
		},
		{
			// Parallel long-polls would reorder feedback and detach event ownership from delivery.
			files: ['packages/local/src/adapters/inbound/pi/desk-listener.ts'],
			rules: { 'eslint/no-await-in-loop': 'off' },
		},
		{
			// Sequential by design: one correspondent event at a time, answers in question order (as the long-poll).
			files: [
				'packages/local/src/adapters/inbound/pi/pi-attachment.ts',
				'packages/local/src/adapters/inbound/pi/pi-delivery.ts',
			],
			rules: { 'eslint/no-await-in-loop': 'off' },
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
			// contracts is a neutral sink; domain is pure (node:crypto stays allowed for pure hashing); core and local never import the browser and vice versa.
			files: ['packages/contracts/src/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
									'@syneva/frontend',
									'@syneva/frontend/**',
								],
								message:
									'contracts is a neutral dependency sink - it imports no core/local/frontend module.',
							},
						],
					},
				],
			},
		},
		{
			// Core is Workers-clean as a CI gate, not as hygiene (RFC 0001, 3.1, 6.1 W4, 6.3 R12): no Node module but node:path/node:crypto, no Node global, no timer, nothing from local or the browser. domain overrides the import rule below, carrying these bans with its own.
			files: ['packages/core/src/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{ patterns: CORE_IMPORT_BANS },
				],
				'eslint/no-restricted-globals': ['error', ...CORE_GLOBAL_BANS],
			},
		},
		{
			// A later override replaces a rule for the same files: domain's import restrictions (its layer purity plus core's bans) live together in ONE declaration, after core's.
			files: [
				'packages/core/src/domain/*.ts',
				'packages/core/src/domain/**/*.ts',
			],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/contracts',
									'@syneva/contracts/**',
									'../application/**',
									'../../application/**',
									'../../../application/**',
									'../hub/**',
									'../../hub/**',
									'../../../hub/**',
									'../http/**',
									'../../http/**',
									'../../../http/**',
								],
								message:
									'domain is pure - no contracts (shared shapes are re-declared in review.ts), no application, hub or http.',
							},
						],
					},
					// No IO either: core's bans cover every Node module domain once refused (fs, http, child_process, net, process) and more.
					{ patterns: CORE_IMPORT_BANS },
				],
			},
		},
		{
			// local is the Node side (RFC 0001, 3.1): it imports core and contracts, never the browser UI world.
			files: ['packages/local/src/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/frontend',
									'@syneva/frontend/**',
								],
								message:
									'local never imports the browser UI world.',
							},
						],
					},
				],
			},
		},
		{
			// Each layer keeps exactly ONE effective declaration (later overrides replace rules); @features/context is the one deliberate layer seam.
			files: ['packages/frontend/src/shared/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
							{
								group: [
									'@app',
									'@app/**',
									'@pages',
									'@pages/**',
									'@widgets',
									'@widgets/**',
									'@features',
									'@features/**',
									'@entities',
									'@entities/**',
								],
								message:
									'shared imports nothing above itself - only other shared modules and @syneva/contracts.',
							},
							{
								group: [
									'../app',
									'../app/**',
									'../../app/**',
									'../../../app/**',
									'../pages',
									'../pages/**',
									'../../pages/**',
									'../../../pages/**',
									'../widgets',
									'../widgets/**',
									'../../widgets/**',
									'../../../widgets/**',
									'../features',
									'../features/**',
									'../../features/**',
									'../../../features/**',
									'../entities',
									'../entities/**',
									'../../entities/**',
									'../../../entities/**',
									'../worker',
									'../worker/**',
									'../../worker/**',
									'../../../worker/**',
								],
								message:
									'cross-layer imports use the layer aliases - relative paths must stay inside shared/.',
							},
						],
					},
				],
			},
		},
		{
			files: ['packages/frontend/src/entities/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
							{
								group: [
									'@app',
									'@app/**',
									'@pages',
									'@pages/**',
									'@widgets',
									'@widgets/**',
									'@features',
									'@features/**',
								],
								message:
									'entities import shared and entities only - never features/widgets/pages/app.',
							},
							{
								group: ['@entities/**'],
								message:
									'entities never import another entity slice; intra-slice imports are relative.',
							},
							{
								group: [
									...relativeLayerEscapes(
										'app',
										'pages',
										'widgets',
										'features',
										'shared',
										'worker',
									),
									...relativeLayerEscapes('settings'),
								],
								message:
									'cross-layer imports use the layer aliases - relative paths must stay inside the entity slice.',
							},
						],
					},
				],
			},
		},
		{
			files: ['packages/frontend/src/features/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
							{
								group: [
									'@app',
									'@app/**',
									'@pages',
									'@pages/**',
									'@widgets',
									'@widgets/**',
								],
								message:
									'features import entities/shared only - never widgets/pages/app.',
							},
							{
								group: ['@features/**', '!@features/context'],
								message:
									'features never import another feature slice; intra-slice imports are relative. The layer seam @features/context is the one exception.',
							},
							{
								group: [
									...relativeLayerEscapes(
										'app',
										'pages',
										'widgets',
										'entities',
										'shared',
										'worker',
									),
									...relativeLayerEscapes(
										'decide-change',
										'expand-context',
										'manage-comment',
										'open-editor',
										'send-review',
									),
								],
								message:
									'cross-layer imports use the layer aliases - relative paths must stay inside the feature slice.',
							},
						],
					},
				],
			},
		},
		{
			files: ['packages/frontend/src/widgets/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
							{
								group: [
									'@app',
									'@app/**',
									'@pages',
									'@pages/**',
								],
								message:
									'widgets import features/entities/shared only - never pages/app.',
							},
							{
								group: ['@widgets/**'],
								message:
									'widgets never import another widget slice; intra-slice imports are relative.',
							},
							{
								group: [
									...relativeLayerEscapes(
										'app',
										'pages',
										'features',
										'entities',
										'shared',
										'worker',
									),
									...relativeLayerEscapes(
										'chrome',
										'dialogs',
									),
								],
								message:
									'cross-layer imports use the layer aliases - relative paths must stay inside the widget slice.',
							},
						],
					},
				],
			},
		},
		{
			files: ['packages/frontend/src/pages/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
							{
								group: ['@app', '@app/**'],
								message:
									'pages compose widgets/features/entities/shared - they never import app.',
							},
							{
								group: [
									...relativeLayerEscapes(
										'app',
										'widgets',
										'features',
										'entities',
										'shared',
										'worker',
									),
								],
								message:
									'cross-layer imports use the layer aliases - relative paths must stay inside pages/.',
							},
							{
								group: ['@pages/**'],
								message:
									'pages never import another page slice; intra-slice imports are relative.',
							},
						],
					},
				],
			},
		},
		{
			// app and the worker are composition roots (import every layer) but never core or local.
			files: [
				'packages/frontend/src/app/**/*.ts',
				'packages/frontend/src/worker/**/*.ts',
			],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								group: [
									'@syneva/core',
									'@syneva/core/**',
									'@syneva/local',
									'@syneva/local/**',
								],
								message:
									'the browser imports contracts only - never core or local.',
							},
						],
					},
				],
			},
		},

		{
			// tsgolint cannot resolve the frontend layer aliases (it ignores tsconfig paths), so its type-aware rules fire unsoundly there: the frontend's type gate is tsconfig.ui.json via pnpm check, core and local stay fully type-linted.
			files: [
				'packages/frontend/src/**/*.ts',
				'packages/frontend/src/**/*.tsx',
			],
			rules: {
				'typescript/no-redundant-type-constituents': 'off',
				'typescript/prefer-nullish-coalescing': 'off',
				'typescript/no-unnecessary-condition': 'off',
				'typescript/no-unnecessary-type-assertion': 'off',
				'typescript/require-array-sort-compare': 'off',
			},
		},
		{
			// Composition modules (main.ts wires every slice, render.ts is the one render funnel, diff-instance.ts orchestrates the diff island): splitting them would scatter composition.
			files: [
				'packages/frontend/src/app/main.tsx',
				'packages/frontend/src/pages/desk/render.ts',
				'packages/frontend/src/widgets/diff-view/diff-instance.ts',
			],
			rules: { 'import/max-dependencies': 'off' },
		},
		{
			// The Proxy handlers ARE the wrap/unwrap seam: the type assertions are the seam itself.
			files: [
				'packages/frontend/src/shared/lib/reactive.ts',
				'packages/frontend/src/widgets/chrome/react/settings-descriptors.ts',
			],
			rules: {
				'nextnode/no-type-assertion': 'off',
				'typescript/no-unsafe-type-assertion': 'off',
				// The descriptor table's keys are the domain; the generic only carries the
				// write boundary.
				'typescript/no-unnecessary-type-parameters': 'off',
			},
		},
		{
			// The React chrome is a view over the mutable reactive store (useSyncExternalStore): handler-side writes are the designed mutation path; the effects sync external systems that are not render derivations.
			files: [
				'packages/frontend/src/widgets/chrome/react/**',
				'packages/frontend/src/widgets/guide-pane/react/**',
				'packages/frontend/src/widgets/hub-shell/react/**',
				'packages/frontend/src/pages/dashboard/**/*.tsx',
				'packages/frontend/src/entities/hub/use-hub.ts',
				'packages/frontend/src/pages/dashboard/use-document-title.ts',
				'packages/frontend/src/pages/dashboard/use-new-review-shortcut.ts',
				'packages/frontend/src/pages/dashboard/use-escape-to-disarm.ts',
				'packages/frontend/src/pages/dashboard/use-focus-next.ts',
				'packages/frontend/src/app/react/app.tsx',
			],
			rules: {
				'react/immutability': 'off',
				// Row/action fragments live in one file, where only together do they make sense.
				'react/no-multi-comp': 'off',
				'nextnode/no-use-effect': 'off',
			},
		},
		{
			// The fixtures encode the workload by design (an 8k-line giant, a 2.4MB oversized file) and report through console.log; sequenced awaits ARE the measurement, so no parallelizing.
			files: [
				'test/benchmarks/bench-fixtures.mjs',
				'test/benchmarks/browser-bench.mjs',
				'test/benchmarks/perf-smoke.mjs',
			],
			rules: {
				'eslint/no-magic-numbers': 'off',
				'eslint/no-console': 'off',
				'eslint/max-lines': 'off',
				'eslint/max-lines-per-function': 'off',
				'eslint/max-depth': 'off',
				'nextnode/no-nullish-ternary-return': 'off',
				// The instruments reach into syneva's own store singleton by the underscore convention.
				'eslint/no-underscore-dangle': 'off',
				'eslint/no-await-in-loop': 'off',
				// Best-effort cleanup and read probes swallow expected failures.
				'eslint/no-empty': 'off',
			},
		},
		{
			// The stream's conformance check and the web's smoke are scenarios: each step waits on the answer to the one before, so their awaits are sequenced by design.
			files: ['test/stream/*.mjs', 'test/web/*.mjs'],
			rules: { 'eslint/no-await-in-loop': 'off' },
		},
		{
			// The cost tests (RFC 0001, 6.7) encode a workload by design, like the benchmarks: frame rates, sizes in MiB, close codes, HTTP statuses and deadlines are the numbers under test, each printed in the check that uses it, and the scenarios are long sequences whose awaits wait on the answer to the one before. The fake sockets read `ws`'s own receiver (underscore) for the close frame, which `ws` reports a TCP close late.
			files: ['test/web/cost/**/*.mjs'],
			rules: {
				'eslint/no-magic-numbers': 'off',
				'eslint/no-await-in-loop': 'off',
				'eslint/max-lines': 'off',
				'eslint/max-lines-per-function': 'off',
				'eslint/max-depth': 'off',
				'eslint/no-underscore-dangle': 'off',
			},
		},
		{
			// apps/web outside the object: the Worker and its routes (RFC 0001, 6.3).
			files: ['apps/web/src/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{ patterns: [WEB_IMPORT_BANS] },
				],
				'eslint/no-restricted-globals': ['error', ...WEB_TIMER_BANS],
			},
		},
		{
			// The object: one effective declaration per rule (later overrides replace rules); its one log line is console.error, on a socket's error only.
			files: ['apps/web/src/bridge/**/*.ts'],
			rules: {
				'eslint/no-restricted-imports': [
					'error',
					{ patterns: [BRIDGE_IMPORT_BANS] },
				],
				'eslint/no-restricted-globals': [
					'error',
					...BRIDGE_GLOBAL_BANS,
					...BRIDGE_STREAM_BANS,
				],
				'eslint/no-restricted-properties': [
					'error',
					...BRIDGE_PROPERTY_BANS,
				],
				'eslint/no-console': ['error', { allow: ['error'] }],
			},
		},
		{
			// The relay is the object's one bounded streaming response.
			files: ['apps/web/src/bridge/relay.ts'],
			rules: {
				'eslint/no-restricted-globals': [
					'error',
					...BRIDGE_GLOBAL_BANS,
				],
			},
		},
		{
			// The Worker's one log boundary (an unexpected throw, a failed send), as the landing's log-failure.server.ts.
			files: ['apps/web/src/http/log.ts'],
			rules: { 'eslint/no-console': ['error', { allow: ['error'] }] },
		},
		{
			// MAIL_TRANSPORT=log: the sign-in link goes to wrangler dev's stdout instead of an inbox (local only; a deploy sets RESEND_API_KEY).
			files: ['apps/web/src/auth/mail.ts'],
			rules: { 'eslint/no-console': ['error', { allow: ['log'] }] },
		},
		{
			// wrangler's contract: the entry module default-exports the Worker's handler and exports the Durable Object class its config binds.
			files: ['apps/web/src/worker.ts'],
			rules: {
				'import/no-default-export': 'off',
				'nextnode/no-barrel-file': 'off',
			},
		},
		{
			// The landing Worker's one log boundary, as adapters/outbound/console.ts is local's: Workers Logs-style JSON.
			files: [
				'apps/landing/src/features/subscribe/model/log-failure.server.ts',
			],
			rules: { 'eslint/no-console': 'off' },
		},
		{
			// pi's loader contract: the entry default-exports register.
			files: ['apps/syneva/extension/syneva.ts'],
			rules: {
				'import/no-default-export': 'off',
			},
		},
		{
			// It types the shared preset's default export itself.
			files: ['types/**/*.d.ts'],
			rules: {
				'import/no-default-export': 'off',
			},
		},
	],
})
