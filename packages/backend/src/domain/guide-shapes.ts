// Structural mirror of packages/contracts/src/guide.ts (domain may not import contracts): the validator builds these field by field, the projection and the store serialize them whole - keep both sides in sync.
import type { GuideModel } from './guide-model-shapes.js'
import type {
	ApiBlock,
	DataModelBlock,
	WireframeBlock,
} from './guide-structure-shapes.js'
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

// What an agent may also write when it posts a guide over the desk's current one (guide-compose.ts): every block of a declaration (`Class` takes its members too), or every block a current domain owns. They resolve to `change` and `file` members before the guide attaches.
export type AuthoredMember =
	| GuideMember
	| { kind: 'symbol'; path: string; symbol: string }
	| { kind: 'domain'; id: string }

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

// Changed code to read line by line: one of the domain's `changed` references and what a wrong line there costs.
export type GuideCritical = { ref: string; why: string }

export type BlockBase = {
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

// A posted domain: without members it keeps the blocks the current domain of that id owns.
export type AuthoredDomain = Omit<GuideDomain, 'members'> & {
	members?: AuthoredMember[] | undefined
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
	model?: GuideModel | undefined
	baseDiffHash?: string | undefined
}

export type AuthoredGuide = Omit<Guide, 'domains'> & {
	domains: AuthoredDomain[]
}

export const GUIDE_LIMITS = {
	domains: 60,
	membersPerDomain: 400,
	referencesPerDomain: 60,
	blocksPerDomain: 12,
	criticalPerDomain: 8,
	diagramNodes: 40,
	diagramEdges: 80,
	entityFields: 30,
	endpoints: 20,
	wireframeNodes: 80,
	wireframeDepth: 8,
	modelElements: 60,
	modelRelations: 120,
	modelViews: 12,
	viewSteps: 30,
	modelDepth: 3,
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
	fileHashes?: Record<string, string> | undefined
	refs: Record<string, ResolvedReference>
	stale?: { reasons: string[] } | undefined
}

export type GuideResolution = {
	fingerprint: string
	domains: Record<string, DomainResolution>
	unassigned: { units: string[]; files: string[] }
	drafted?: string[] | undefined
	overviewDrafted?: boolean | undefined
}

export type GuideIssue = {
	field: string
	target?: string | undefined
	reason: string
}
