// Every piece of the hero stage the runtime drives, named once: the markup
// marks a piece with stagePart() and the timeline and the pointer select it
// with stagePartSelector(), so a name only one side knows fails astro check.
export type StagePart =
	| 'agent'
	| 'desk'
	| 'ledger'
	| 'card'
	| 'bar'
	| 'rail'
	| 'rail-dots'
	| 'more'
	| 'focus'
	| 'rev'
	| 'idle'
	| 'caret'
	| 'head'
	| 'accept'
	| 'accept-glyph'
	| 'row'
	| 'strike'
	| 'band-removed'
	| 'band-added'
	| 'sweep'
	| 'gutter-check'
	| 'chip'
	| 'leader'
	| 'thread'
	| 'you'
	| 'typing'
	| 'agent-says'
	| 'cursor'
	| 'signal-in'
	| 'signal-out'
	| 'signal-back'
	| 'round-1'
	| 'round-2'
	| 'verdict'
	| 'row-pending'
	| 'fill'
	| 'progress-1'
	| 'progress-2'
	| 'send-box'
	| 'send-label'
	| 'send-sent'

export const stagePart = (
	name: StagePart,
): { 'data-stage-part': StagePart } => ({ 'data-stage-part': name })

export const stagePartSelector = (name: StagePart): string =>
	`[data-stage-part="${name}"]`
