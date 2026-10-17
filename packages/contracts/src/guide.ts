// The guide: an externally authored, risk-ranked explanation of the coherent behaviors a changeset changes.
// Syneva validates and renders it, never writes it; the backend domain mirrors these shapes (domain/guide-shapes.ts) - keep both sides in sync.
import type { GuideModel } from './guide-model.js'
import type {
	ApiBlock,
	DataModelBlock,
	WireframeBlock,
} from './guide-structures.js'
import type { ReviewMode } from './review.js'

// The schema id every guide names; a guide without it (the retired file-grouping format included) is refused, never adapted.
export const GUIDE_FORMAT = 'syneva-guide/2'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

// Highest risk first; the index is the sort key (sortDomains).
export const RISK_ORDER: readonly RiskLevel[] = [
	'critical',
	'high',
	'medium',
	'low',
]

export type CodeSide = 'additions' | 'deletions'

// A span of ORIGINAL code: `additions` is the new file, `deletions` the old one, lines 1-based in that file.
// Rendered-diff numbers are never identities (the desk renumbers them per render).
export type CodeSpan = {
	path: string
	side: CodeSide
	lineNumber: number
	endLine?: number | undefined
}

// What a domain owns. A `change` member names changed code by any line of the changed block on its side; a `file` member owns a file operation that has no text block (a pure rename, an untracked addition, a hunk-less deletion).
export type GuideMember =
	| ({ kind: 'change' } & CodeSpan)
	| { kind: 'file'; path: string }

// What an agent may also write in a posted guide, resolved by the desk into `change` and `file` members before the guide attaches: `symbol` owns every changed block of a declaration (a class takes its members too) in one file; `domain` owns every block a domain of the desk's current guide owns (the draft's included).
export type AuthoredMember =
	| GuideMember
	| { kind: 'symbol'; path: string; symbol: string }
	| { kind: 'domain'; id: string }

// A code target an explanation points at. `changed` points into changed code (this domain's or another's); `context` points at supporting unchanged code on the reviewed revision - read-only, never a change to approve.
export type GuideReference = CodeSpan & {
	id: string
	role: 'changed' | 'context'
	label?: string | undefined
}

export type GuideCrossReference = {
	domainId: string
	note?: string | undefined
}

// A risk claim and the references that back it; a claim without refs is the agent's word alone and reads as such.
export type GuideEvidence = { text: string; refs?: string[] | undefined }

// Changed code the reviewer must read line by line whatever the explanation says (money moving, access granted, data deleted): the visual level shows these spans as code and nothing else. `ref` names one of the domain's `changed` references, `why` says what a wrong line there costs.
export type GuideCritical = { ref: string; why: string }

export type BlockBase = {
	id: string
	title?: string | undefined
	// Reference ids (GuideDomain.references) the block as a whole rests on.
	refs?: string[] | undefined
	// Longer reasoning, assumptions or failure cases (Markdown), collapsed until the reviewer expands it.
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

// A dependency or data-flow relationship.
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

export type ExplanationBlockKind = ExplanationBlock['kind']

export type GuideDomain = {
	// Stable across guides of the same changeset: feedback and review position key on it, never on the title or the position.
	id: string
	title: string
	risk: RiskLevel
	// The concrete failure if this behavior is wrong - the reason for the risk, not a restatement of it.
	consequence: string
	// The minimum context: what the behavior is for, in a sentence or two.
	summary: string
	// What the reviewer should check with their own eyes.
	verify?: string | undefined
	// Domains to read first; summarized beside this one, never used to move it below them.
	prerequisites?: string[] | undefined
	members: GuideMember[]
	references?: GuideReference[] | undefined
	related?: GuideCrossReference[] | undefined
	evidence?: GuideEvidence[] | undefined
	unknowns?: string[] | undefined
	critical?: GuideCritical[] | undefined
	// Agent-chosen, in the agent's order; empty when the summary says it all.
	blocks: ExplanationBlock[]
	// Tie order among domains of the same risk (ascending); the array position when absent.
	order?: number | undefined
}

// A domain as posted: without members it keeps the blocks the desk's current domain of the same id owns; members it lists join it, taken from wherever they were.
export type AuthoredDomain = Omit<GuideDomain, 'members'> & {
	members?: AuthoredMember[] | undefined
}

// The exact review source the guide was authored against; `fingerprint` is the inventory's and must match the desk's at attach.
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
	// The short changeset overview (Markdown): what it does, why, and how the domains fit.
	overview: string
	// Empty on an empty changeset, never otherwise.
	domains: GuideDomain[]
	// The system the domains change, drawn as the visual level; a posted guide without one keeps the desk's.
	model?: GuideModel | undefined
	// Stamped by the desk on attach: the diff the guide describes; a reload advancing past it is what the lifecycle re-resolves against.
	baseDiffHash?: string | undefined
}

// What `syneva reload --guide` and `open --guide` accept: a guide laid over the desk's current one. A domain it names replaces that domain's text; a domain it leaves out stays as it is.
export type AuthoredGuide = Omit<Guide, 'domains'> & {
	domains: AuthoredDomain[]
}

// Bounds the validator enforces; a guide past one is refused naming the field, never truncated.
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

// Risk first, then the authored tie order, then the array position; a domain's prerequisites never move it down.
export function sortDomains<D extends Pick<GuideDomain, 'risk' | 'order'>>(
	domains: readonly D[],
): D[] {
	return domains
		.map((domain, index) => ({ domain, index }))
		.toSorted((a, b) => {
			const risk =
				RISK_ORDER.indexOf(a.domain.risk) -
				RISK_ORDER.indexOf(b.domain.risk)
			if (risk !== 0) return risk
			const order =
				(a.domain.order ?? a.index) - (b.domain.order ?? b.index)
			if (order !== 0) return order
			return a.index - b.index
		})
		.map(entry => entry.domain)
}

// ── Resolution: the guide against the real diff ────────────────────────────────────────────
// Computed by the desk when a guide attaches and refreshed on every reload; the guide itself is never edited.

export type ReferenceStatus = 'resolved' | 'stale' | 'unresolved'

export type ResolvedReference = {
	status: ReferenceStatus
	// The target's content identity when the guide attached: the changed block's contentHash, or the hash of the cited unchanged lines.
	contentHash?: string | undefined
	// What happened to a target that is no longer `resolved`.
	reason?: string | undefined
}

export type OwnedUnit = { key: string; contentHash: string }

export type DomainResolution = {
	// The changed blocks the domain owned when the guide attached, with their identities then.
	units: OwnedUnit[]
	// The hunk-less file operations it owned.
	files: string[]
	// Per owned file operation, its identity then (kind, origin, content): a path alone misses a binary file rewritten in place. Absent on a resolution saved before it existed.
	fileHashes?: Record<string, string> | undefined
	refs: Record<string, ResolvedReference>
	// Set on reload when the owned code, the cited context or a prerequisite changed since the guide was written.
	stale?: { reasons: string[] } | undefined
}

export type GuideResolution = {
	// The inventory fingerprint the guide was attached against.
	fingerprint: string
	domains: Record<string, DomainResolution>
	// Changed units and file operations no domain owns now (empty when the guide attached; a reload can grow it).
	unassigned: { units: string[]; files: string[] }
	// The domains Syneva drafted from the code's structure that no agent has explained yet: their text is mechanical.
	drafted?: string[] | undefined
	overviewDrafted?: boolean | undefined
}

// One thing wrong with a guide against its inventory, named by the field and the target it concerns.
export type GuideIssue = {
	field: string
	target?: string | undefined
	reason: string
}

// Overlap on the same file and side: the rule membership and references resolve by, shared by the hub and the desk.
export function spanOverlaps(
	span: { lineNumber: number; endLine?: number | undefined },
	unit: { lineNumber: number; endLine?: number | undefined },
): boolean {
	const spanEnd = span.endLine ?? span.lineNumber
	const unitEnd = unit.endLine ?? unit.lineNumber
	return span.lineNumber <= unitEnd && unit.lineNumber <= spanEnd
}
