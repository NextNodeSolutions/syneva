import { partAttribute } from '@shared/lib/part-attribute'

// Pieces named once: markup marks with introPart(), hero-intro.ts plays by the same name - a one-side-only name fails astro check.
export type IntroPart =
	| 'news'
	| 'gutter'
	| 'agent-mark'
	| 'agent-band'
	| 'agent-text'
	| 'human-mark'
	| 'human-check'
	| 'human-band'
	| 'human-text'
	| 'underline'
	| 'copy'
	| 'stage'
	| 'principles'

export const { mark: introPart, selector: introPartSelector } =
	partAttribute<IntroPart>('data-hero-intro')
