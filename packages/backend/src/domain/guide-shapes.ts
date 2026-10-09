// Structural mirror of packages/contracts/src/guide.ts (domain may not import contracts): the validator builds these field by field, the projection and the store serialize them whole - keep both sides in sync.
import type { ReviewMode } from './review.js'

export const GUIDE_FORMAT = 'syneva-guide/2'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export const RISK_LEVELS: readonly RiskLevel[] = [
	'critical',
	'high',
	'medium',
	'low',
]

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
	mode: ReviewMode
	fingerprint: string
	head?: string | null | undefined
	base?: string | undefined
	staged?: boolean | undefined
	path?: string | undefined
}

export type Guide = {
	format: typeof GUIDE_FORMAT
	source: GuideSource
	overview: string
	domains: GuideDomain[]
	baseDiffHash?: string | undefined
}

export const GUIDE_LIMITS = {
	domains: 60,
	membersPerDomain: 400,
	referencesPerDomain: 60,
	blocksPerDomain: 12,
	diagramNodes: 40,
	diagramEdges: 80,
	overviewChars: 3000,
	markdownChars: 20_000,
	textChars: 1000,
	labelChars: 120,
	idChars: 80,
} as const

// ── Resolution (mirror of the contract's) ──────────────────────────────────────────────────

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
}

export type GuideIssue = {
	field: string
	target?: string | undefined
	reason: string
}
