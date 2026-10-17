// The system model: the parts a changeset lives in and how they talk, written once per guide in the spirit of a C4 model (LikeC4's elements, relationships and dynamic views) and drawn as the desk's visual level. Each element names the domains that change it, so the reviewer sees the change light up the system before reading any code. Split from guide.ts, which hangs it on the Guide; the backend domain mirrors it (domain/guide-model-shapes.ts).
import type { ChangeMark } from './guide-structures.js'

// What an element is, which sets how it is drawn: a person, a whole system (usually holding others), a screen, a running process, a module inside one, a place data rests, a channel messages travel, a third party.
export type ModelElementKind =
	| 'actor'
	| 'system'
	| 'ui'
	| 'service'
	| 'component'
	| 'store'
	| 'queue'
	| 'external'

export const MODEL_ELEMENT_KINDS: readonly ModelElementKind[] = [
	'actor',
	'system',
	'ui',
	'service',
	'component',
	'store',
	'queue',
	'external',
]

export type ModelElement = {
	id: string
	kind: ModelElementKind
	label: string
	// What it is for, in a sentence.
	description?: string | undefined
	// What it runs on or is built with (Postgres, the Stripe API, React).
	technology?: string | undefined
	// The element it sits in, drawn inside it: a system holds its services, a service its components.
	parent?: string | undefined
	change?: ChangeMark | undefined
	// The guide's domains that change this element: what lights up when the reviewer picks a domain, and where a click on the element leads.
	domains?: string[] | undefined
}

export type ModelRelation = {
	from: string
	to: string
	label?: string | undefined
	technology?: string | undefined
	change?: ChangeMark | undefined
}

export type ModelStep = {
	from: string
	to: string
	label: string
	change?: ChangeMark | undefined
}

// A dynamic view: one path through the model told as numbered steps (a checkout, a webhook arriving), drawn on its own with only the elements it passes through.
export type ModelView = {
	id: string
	title: string
	description?: string | undefined
	// The domains this path walks through.
	domains?: string[] | undefined
	steps: ModelStep[]
}

export type GuideModel = {
	elements: ModelElement[]
	relations: ModelRelation[]
	views?: ModelView[] | undefined
}
