// The system model as the desk reads it (mirror of packages/contracts/src/guide-model.ts): the parts the changeset lives in, how they talk, and the paths the domains walk through them.
import type { ChangeMark } from './model'

export type ModelElementKind =
	| 'actor'
	| 'system'
	| 'ui'
	| 'service'
	| 'component'
	| 'store'
	| 'queue'
	| 'external'

export type ModelElement = {
	id: string
	kind: ModelElementKind
	label: string
	description?: string | undefined
	technology?: string | undefined
	parent?: string | undefined
	change?: ChangeMark | undefined
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

export type ModelView = {
	id: string
	title: string
	description?: string | undefined
	domains?: string[] | undefined
	steps: ModelStep[]
}

export type GuideModel = {
	elements: ModelElement[]
	relations: ModelRelation[]
	views?: ModelView[] | undefined
}
