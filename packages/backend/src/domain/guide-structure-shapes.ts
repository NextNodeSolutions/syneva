// The structural blocks' shapes (mirrors @syneva/contracts/guide-structures): a data model, an API and a sketched screen.
import type { BlockBase } from './guide-shapes.js'

// What an element of a block is to the changeset: new, altered or gone. Left out, the element is unchanged context drawn for orientation.
export type ChangeMark = 'added' | 'changed' | 'removed'

export const CHANGE_MARKS: readonly ChangeMark[] = [
	'added',
	'changed',
	'removed',
]

// A field of a data entity or of an API message.
export type DataField = {
	name: string
	type?: string | undefined
	change?: ChangeMark | undefined
	note?: string | undefined
	ref?: string | undefined
}

export type DataEntity = {
	id: string
	label: string
	ref?: string | undefined
	change?: ChangeMark | undefined
	fields: DataField[]
}

export type Cardinality = '1-1' | '1-n' | 'n-1' | 'n-n'

export const CARDINALITIES: readonly Cardinality[] = [
	'1-1',
	'1-n',
	'n-1',
	'n-n',
]

export type DataRelation = {
	from: string
	to: string
	label?: string | undefined
	cardinality?: Cardinality | undefined
	change?: ChangeMark | undefined
}

// Tables, types or documents and how they reference each other, each field marked by what the change does to it.
export type DataModelBlock = BlockBase & {
	kind: 'data-model'
	entities: DataEntity[]
	relations: DataRelation[]
}

export type ApiMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'EVENT'
	| 'COMMAND'
	| 'RPC'

export const API_METHODS: readonly ApiMethod[] = [
	'GET',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'EVENT',
	'COMMAND',
	'RPC',
]

// One entry point of a contract: an HTTP route, an emitted event, a CLI command, an RPC.
export type ApiEndpoint = {
	id: string
	method: ApiMethod
	path: string
	summary?: string | undefined
	change?: ChangeMark | undefined
	ref?: string | undefined
	request?: DataField[] | undefined
	response?: DataField[] | undefined
}

export type ApiBlock = BlockBase & { kind: 'api'; endpoints: ApiEndpoint[] }

export type WireframeElement =
	| 'screen'
	| 'header'
	| 'sidebar'
	| 'main'
	| 'footer'
	| 'row'
	| 'column'
	| 'card'
	| 'dialog'
	| 'tabs'
	| 'list'
	| 'item'
	| 'table'
	| 'title'
	| 'text'
	| 'button'
	| 'input'
	| 'select'
	| 'checkbox'
	| 'image'
	| 'badge'
	| 'toast'
	| 'divider'

export const WIREFRAME_ELEMENTS: readonly WireframeElement[] = [
	'screen',
	'header',
	'sidebar',
	'main',
	'footer',
	'row',
	'column',
	'card',
	'dialog',
	'tabs',
	'list',
	'item',
	'table',
	'title',
	'text',
	'button',
	'input',
	'select',
	'checkbox',
	'image',
	'badge',
	'toast',
	'divider',
]

// One element of a sketched screen; the containers (screen, header, sidebar, main, footer, row, column, card, dialog, tabs, list, table) lay their children out, the rest are leaves.
export type WireframeNode = {
	el: WireframeElement
	label?: string | undefined
	change?: ChangeMark | undefined
	ref?: string | undefined
	children?: WireframeNode[] | undefined
}

export type WireframeSurface = 'desktop' | 'mobile' | 'panel' | 'dialog'

export const WIREFRAME_SURFACES: readonly WireframeSurface[] = [
	'desktop',
	'mobile',
	'panel',
	'dialog',
]

// The screen the change touches, sketched before and after (or after alone for a new one): what the user sees differently, without reading a component.
export type WireframeBlock = BlockBase & {
	kind: 'wireframe'
	surface?: WireframeSurface | undefined
	before?: WireframeNode | undefined
	after: WireframeNode
}
