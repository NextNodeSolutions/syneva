// One domain's code as the agent reads it to explain the domain: the diff hunks holding its blocks, the declarations they change and the reference ids an explanation may cite - everything in one Markdown file, so no tool call is spent fetching code. Bounded: past its line budget the diff moves to an appendix at the very end of the file, so the reader takes the bounded part (and the rules after it) first and reads the rest only when it needs it - code a deletion took is nowhere else it could read.
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

// What the packet's budget left out of one hunk: its lines from `from` on (0: the whole hunk).
type HunkTail = { ref: HunkRef; from: number }

export type PacketText = { body: string; appendix: string | undefined }

const LEFT_OUT = 'the appendix at the end of this packet holds them'

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

// The hunk's lines from `start` (to `end`), under its header: a new file arrives as one hunk, and one hunk must not spend the whole packet.
function hunkText(hunk: DiffHunk, start: number, end?: number): string {
	const lines = hunk.lines
		.slice(start, end)
		.map(line => `${LINE_MARKS[line.kind]}${line.text}`)
	return [hunk.header, ...lines].join('\n')
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

function fenced(lead: string, text: string): string[] {
	const fence = fenceFor(text)
	return [lead, '', `${fence}diff`, text, fence]
}

function hunkSection({ hunk, changes }: HunkRef, room: number): string[] {
	const hidden = hunk.lines.length - room
	return [
		...fenced(`Changes ${declaredIn(changes)}.`, hunkText(hunk, 0, room)),
		...(hidden > 0
			? [
					`(${hidden} more lines of this hunk not shown here: ${LEFT_OUT}.)`,
				]
			: []),
		'',
	]
}

// The hunks in diff order until the budget is spent; every line it could not show is kept for the appendix.
function bodyOf(hunks: readonly HunkRef[]): {
	shown: string[]
	left: HunkTail[]
} {
	const shown: string[] = []
	const left: HunkTail[] = []
	let budget = PACKET_LINES
	let lastPath = ''
	for (const ref of hunks) {
		if (budget <= 0) {
			left.push({ ref, from: 0 })
			continue
		}
		if (ref.file.path !== lastPath) shown.push(`## ${ref.file.path}`, '')
		lastPath = ref.file.path
		shown.push(...hunkSection(ref, budget))
		if (ref.hunk.lines.length > budget) left.push({ ref, from: budget })
		budget -= ref.hunk.lines.length
	}
	const unshown = left.filter(tail => tail.from === 0).length
	if (unshown)
		shown.push(`(${unshown} more hunks not shown here: ${LEFT_OUT}.)`, '')
	return { shown, left }
}

function tailSection({ ref, from }: HunkTail): string[] {
	const lead = from
		? `The rest of a hunk shown above, from its line ${from + 1}.`
		: `Changes ${declaredIn(ref.changes)}.`
	return [...fenced(lead, hunkText(ref.hunk, from)), '']
}

// Everything the budget left out, in full and in diff order.
function appendixOf(left: readonly HunkTail[]): string | undefined {
	if (!left.length) return undefined
	const lines = [
		'## Appendix: the diff this packet leaves out',
		'',
		'Read it only when the hunks above are not enough to explain the domain.',
		'',
	]
	let lastPath = ''
	for (const tail of left) {
		if (tail.ref.file.path !== lastPath)
			lines.push(`### ${tail.ref.file.path}`, '')
		lastPath = tail.ref.file.path
		lines.push(...tailSection(tail))
	}
	return lines.join('\n')
}

export function domainPacket(
	domain: GuideDomain,
	owned: DomainResolution,
	state: ReviewState,
	reason: string,
): PacketText {
	const files = owned.files.map(file => `- ${file}`)
	const { shown, left } = bodyOf(hunksOf(owned, state))
	const body = [
		...headOf(domain, owned, reason),
		...shown,
		...(files.length
			? [
					'## Files without a text diff',
					'',
					'A rename, a deletion or an untracked addition: read the file in the repository when its content matters.',
					'',
					...files,
					'',
				]
			: []),
	].join('\n')
	return { body, appendix: appendixOf(left) }
}
