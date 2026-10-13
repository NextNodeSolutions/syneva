// One domain's code as the agent reads it to explain the domain: the diff hunks holding its blocks, the declarations they change and the reference ids an explanation may cite - everything in one Markdown file, so no tool call is spent fetching code. Bounded: a packet past its line budget names what it left out.
import { changeKey } from './change-blocks.js'

import type {
	DomainResolution,
	GuideDomain,
	GuideReference,
	ResolvedReference,
} from './guide-shapes.js'
import type {
	ChangeState,
	DiffHunk,
	ReviewFile,
	ReviewState,
} from './review.js'

// About 15k tokens of diff: enough for any reasonable domain, and a bound on what one explanation reads.
const PACKET_LINES = 1200
const MIN_FENCE = 3
const LINE_MARKS = { context: ' ', add: '+', delete: '-' } as const

type HunkRef = { file: ReviewFile; hunk: DiffHunk; changes: ChangeState[] }

// The hunks holding the domain's blocks, in the diff's own order.
function hunksOf(owned: DomainResolution, state: ReviewState): HunkRef[] {
	const keys = new Set(owned.units.map(unit => unit.key))
	const byHunk = new Map<string, ChangeState[]>()
	for (const change of state.changes) {
		if (!keys.has(changeKey(change))) continue
		const key = `${change.path}\0${change.hunkIndex}`
		byHunk.set(key, [...(byHunk.get(key) ?? []), change])
	}
	return state.files.flatMap(file =>
		file.hunks.flatMap((hunk, index) => {
			const changes = byHunk.get(`${file.path}\0${index}`)
			return changes ? [{ file, hunk, changes }] : []
		}),
	)
}

// A fence longer than any backtick run in the code, so a hunk quoting Markdown never closes it.
function fenceFor(text: string): string {
	const longest = Math.max(
		0,
		...(text.match(/`+/g) ?? []).map(run => run.length),
	)
	return '`'.repeat(Math.max(MIN_FENCE, longest + 1))
}

// The hunk's first `room` lines: a new file arrives as one hunk, and one hunk must not spend the whole packet.
function hunkText(hunk: DiffHunk, room: number): string {
	const shown = hunk.lines
		.slice(0, room)
		.map(line => `${LINE_MARKS[line.kind]}${line.text}`)
	return [hunk.header, ...shown].join('\n')
}

function declaredIn(changes: readonly ChangeState[]): string {
	const names = [
		...new Set(
			changes.flatMap(change =>
				change.symbol
					? [`\`${change.symbol.name}\` (${change.symbol.kind})`]
					: [],
			),
		),
	]
	return names.length ? names.join(', ') : 'no named declaration'
}

// A reference the code moved under says so: the post that explains the domain again must re-point it or drop it.
function referenceLine(
	reference: GuideReference,
	resolved: ResolvedReference | undefined,
): string {
	const side = reference.side === 'additions' ? '+' : '-'
	const label = reference.label ? ` (${reference.label})` : ''
	const status =
		resolved && resolved.status !== 'resolved'
			? ` - ${resolved.status}${resolved.reason ? `: ${resolved.reason}` : ''}`
			: ''
	return `- \`${reference.id}\`: ${reference.path}:${side}${reference.lineNumber}${label}${status}`
}

function headOf(
	domain: GuideDomain,
	owned: DomainResolution,
	reason: string,
): string[] {
	const references = (domain.references ?? []).map(reference =>
		referenceLine(reference, owned.refs[reference.id]),
	)
	const related = (domain.related ?? []).map(
		link => `\`${link.domainId}\`${link.note ? ` (${link.note})` : ''}`,
	)
	return [
		`# Domain \`${domain.id}\`: ${domain.title}`,
		'',
		reason,
		'',
		...(related.length
			? [`Related domains: ${related.join(', ')}.`, '']
			: []),
		...(references.length
			? ['References an explanation may cite by id:', ...references, '']
			: []),
	]
}

function hunkSection({ hunk, changes }: HunkRef, room: number): string[] {
	const text = hunkText(hunk, room)
	const fence = fenceFor(text)
	const hidden = hunk.lines.length - room
	return [
		`Changes ${declaredIn(changes)}.`,
		'',
		`${fence}diff`,
		text,
		fence,
		...(hidden > 0
			? [`(${hidden} more lines of this hunk not shown.)`]
			: []),
		'',
	]
}

function bodyOf(hunks: readonly HunkRef[]): string[] {
	const lines: string[] = []
	let budget = PACKET_LINES
	let lastPath = ''
	for (const [position, ref] of hunks.entries()) {
		if (budget <= 0) {
			lines.push(
				`(${hunks.length - position} more hunks not shown: read them on the desk or with \`git diff\`.)`,
			)
			break
		}
		if (ref.file.path !== lastPath) lines.push(`## ${ref.file.path}`, '')
		lastPath = ref.file.path
		lines.push(...hunkSection(ref, budget))
		budget -= ref.hunk.lines.length
	}
	return lines
}

export function domainPacket(
	domain: GuideDomain,
	owned: DomainResolution,
	state: ReviewState,
	reason: string,
): string {
	const files = owned.files.map(file => `- ${file}`)
	return [
		...headOf(domain, owned, reason),
		...bodyOf(hunksOf(owned, state)),
		...(files.length
			? ['## File operations (no text diff)', '', ...files, '']
			: []),
	].join('\n')
}
