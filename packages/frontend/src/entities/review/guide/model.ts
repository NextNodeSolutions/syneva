// The guide as the desk reads it: a structural mirror of packages/contracts/src/guide.ts, declared here (not re-exported from the contracts) so the wire type never escapes the entity boundary.
// Optional props are explicitly `T | undefined` under exactOptionalPropertyTypes.

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type CodeSide = 'additions' | 'deletions'

export type CodeSpan = {
	path: string
	side: CodeSide
	lineNumber: number
	endLine?: number | undefined
}

export type GuideMember =
	| ({ kind: 'change' } & CodeSpan)
	| { kind: 'file'; path: string }

export type GuideReference = CodeSpan & {
	id: string
	role: 'changed' | 'context'
	label?: string | undefined
}

export type GuideCrossReference = {
	domainId: string
	note?: string | undefined
}

export type GuideEvidence = { text: string; refs?: string[] | undefined }

// Changed code to read line by line whatever the explanation says: one of the domain's `changed` references and what a wrong line there costs.
export type GuideCritical = { ref: string; why: string }

type BlockBase = {
	id: string
	title?: string | undefined
	refs?: string[] | undefined
	detail?: string | undefined
}

export type ProseBlock = BlockBase & { kind: 'prose'; markdown: string }

export type BeforeAfterSide = {
	label?: string | undefined
	markdown: string
	ref?: string | undefined
}

export type BeforeAfterBlock = BlockBase & {
	kind: 'before-after'
	before: BeforeAfterSide
	after: BeforeAfterSide
}

export type StateNode = {
	id: string
	label: string
	ref?: string | undefined
	isInitial?: boolean | undefined
	isFinal?: boolean | undefined
}

export type StateTransition = {
	from: string
	to: string
	label?: string | undefined
	ref?: string | undefined
}

export type StateBlock = BlockBase & {
	kind: 'state'
	states: StateNode[]
	transitions: StateTransition[]
}

export type SequenceParticipant = { id: string; label: string }

export type SequenceStep = {
	from: string
	to: string
	label: string
	ref?: string | undefined
}

export type SequenceBlock = BlockBase & {
	kind: 'sequence'
	participants: SequenceParticipant[]
	steps: SequenceStep[]
}

export type FlowNode = {
	id: string
	label: string
	ref?: string | undefined
	note?: string | undefined
}

export type FlowEdge = { from: string; to: string; label?: string | undefined }

export type FlowBlock = BlockBase & {
	kind: 'flow'
	nodes: FlowNode[]
	edges: FlowEdge[]
}

// What an element of a block is to the changeset; absent, it is unchanged context.
export type ChangeMark = 'added' | 'changed' | 'removed'

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

export type DataRelation = {
	from: string
	to: string
	label?: string | undefined
	cardinality?: Cardinality | undefined
	change?: ChangeMark | undefined
}

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

export type WireframeNode = {
	el: WireframeElement
	label?: string | undefined
	change?: ChangeMark | undefined
	ref?: string | undefined
	children?: WireframeNode[] | undefined
}

export type WireframeSurface = 'desktop' | 'mobile' | 'panel' | 'dialog'

export type WireframeBlock = BlockBase & {
	kind: 'wireframe'
	surface?: WireframeSurface | undefined
	before?: WireframeNode | undefined
	after: WireframeNode
}

export type ExplanationBlock =
	| ProseBlock
	| BeforeAfterBlock
	| StateBlock
	| SequenceBlock
	| FlowBlock
	| DataModelBlock
	| ApiBlock
	| WireframeBlock

export type GuideDomain = {
	id: string
	title: string
	risk: RiskLevel
	consequence: string
	summary: string
	verify?: string | undefined
	prerequisites?: string[] | undefined
	members: GuideMember[]
	references?: GuideReference[] | undefined
	related?: GuideCrossReference[] | undefined
	evidence?: GuideEvidence[] | undefined
	unknowns?: string[] | undefined
	critical?: GuideCritical[] | undefined
	blocks: ExplanationBlock[]
	order?: number | undefined
}

export type GuideSource = {
	mode: 'repo' | 'file' | 'pr'
	fingerprint: string
	head?: string | null | undefined
	base?: string | undefined
	staged?: boolean | undefined
	path?: string | undefined
}

export type Guide = {
	format: 'syneva-guide/2'
	source: GuideSource
	overview: string
	domains: GuideDomain[]
	baseDiffHash?: string | undefined
}

// ── Resolution: where the guide stands against this diff (mirror of the contract's) ──────

export type ReferenceStatus = 'resolved' | 'stale' | 'unresolved'

export type ResolvedReference = {
	status: ReferenceStatus
	contentHash?: string | undefined
	reason?: string | undefined
}

export type OwnedUnit = { key: string; contentHash: string }

export type DomainResolution = {
	units: OwnedUnit[]
	files: string[]
	refs: Record<string, ResolvedReference>
	stale?: { reasons: string[] } | undefined
}

export type GuideResolution = {
	fingerprint: string
	domains: Record<string, DomainResolution>
	unassigned: { units: string[]; files: string[] }
	// The domains Syneva drafted from the code's structure that no agent has explained yet, and whether the overview is still its draft.
	drafted?: string[] | undefined
	overviewDrafted?: boolean | undefined
}
