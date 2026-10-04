// Every piece of the home headline's entrance, named once: the markup marks
// a piece with introPart() and hero-intro.ts plays it by the same name, so a
// name only one side knows fails astro check.
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

export const introPart = (
	name: IntroPart,
): { 'data-hero-intro': IntroPart } => ({ 'data-hero-intro': name })

export const introPartSelector = (name: IntroPart): string =>
	`[data-hero-intro="${name}"]`
