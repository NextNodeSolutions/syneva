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

export type ExplanationBlock =
	| ProseBlock
	| BeforeAfterBlock
	| StateBlock
	| SequenceBlock
	| FlowBlock

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
