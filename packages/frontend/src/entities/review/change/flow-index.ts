import type {
	ChangeState,
	Decision,
	ReviewComment,
	ReviewState,
} from '../model'

// The tree, walkthrough, progress bar, nav seeks and completion gate classify EVERY file per evaluation, and the per-path predicates each rescan the global changes/comments/decisions/files arrays.
// At 1,275 files × 3,542 change blocks that is millions of reads per pass through the reactive tracking proxy, and one file switch froze the main thread ~20s on a real monorepo desk. One pass groups everything by path.
// Reactivity is preserved by construction: the builder reads the same reactive properties the predicates read, once each - which is why the index MUST be built PER EVALUATION and never cached across effects: a cache hit inside a different effect would register no dependencies.

export type FlowIndex = {
	changesByPath: Map<string, ChangeState[]>
	commentsByPath: Map<string, ReviewComment[]>
	outOfFlow: Set<string>
	// Navigation, progress weight and the completion gate deliberately keep treating approved files normally; EMPTY whenever the pref is off, so every call site can read the set unconditionally.
	distilled: Set<string>
	finished(path: string): boolean
	reviewState(path: string): 'pending' | 'approved' | 'changes-requested'
}

type IndexedState = Pick<
	ReviewState,
	| 'files'
	| 'changes'
	| 'comments'
	| 'decisions'
	| 'reviewedFiles'
	| 'reviewedFileHashes'
>

const EMPTY: IndexedState = {
	files: [],
	changes: [],
	comments: [],
	reviewedFiles: [],
}

type PathItem = { path: string }

function groupByPath<Entry extends PathItem>(
	entries: Entry[],
): Map<string, Entry[]> {
	const byPath = new Map<string, Entry[]>()
	for (const entry of entries) {
		const list = byPath.get(entry.path)
		if (list) list.push(entry)
		else byPath.set(entry.path, [entry])
	}
	return byPath
}

function openChangePathSet(comments: ReviewComment[]): Set<string> {
	const paths = new Set<string>()
	for (const c of comments) {
		if (
			c.status === 'open' &&
			c.role !== 'agent' &&
			c.intent !== 'question'
		)
			paths.add(c.path)
	}
	return paths
}

function rejectedPathSet(decisions: Decision[]): Set<string> {
	const paths = new Set<string>()
	for (const d of decisions) if (d.status === 'rejected') paths.add(d.path)
	return paths
}

// Mirrors the single-call predicates over every path in s.files: a pure rename left the flow, every other file is reviewed normally.
function classifyFiles(files: ReviewState['files']): {
	contentHash: Map<string, string>
	outOfFlow: Set<string>
} {
	const contentHash = new Map<string, string>()
	const outOfFlow = new Set<string>()
	for (const f of files) {
		contentHash.set(f.path, f.contentHash)
		if (f.renamePure) outOfFlow.add(f.path)
	}
	return { contentHash, outOfFlow }
}

export function deriveFlowIndex(
	s: IndexedState | null | undefined,
	options: { distill?: boolean } = {},
): FlowIndex {
	const st = s ?? EMPTY
	const changesByPath = groupByPath(st.changes)
	const commentsByPath = groupByPath(st.comments)
	const openChangePaths = openChangePathSet(st.comments)
	const rejectedPaths = rejectedPathSet(st.decisions ?? [])
	const reviewed = new Set(st.reviewedFiles)
	const hashes = st.reviewedFileHashes ?? {}
	const { contentHash, outOfFlow } = classifyFiles(st.files)
	const distilled = new Set<string>()

	// Signed off AND the recorded hash still matches the file's current content key; a path not in files has no contentHash entry, so the equality fails - same as the original's `!!file` guard.
	const finished = (path: string): boolean => {
		const h = hashes[path]
		return reviewed.has(path) && !!h && h === contentHash.get(path)
	}
	const reviewState = (
		path: string,
	): 'pending' | 'approved' | 'changes-requested' => {
		if (!finished(path)) return 'pending'
		return rejectedPaths.has(path) || openChangePaths.has(path)
			? 'changes-requested'
			: 'approved'
	}
	if (options.distill)
		for (const file of st.files.filter(
			x => reviewState(x.path) === 'approved',
		))
			distilled.add(file.path)
	return {
		changesByPath,
		commentsByPath,
		outOfFlow,
		distilled,
		finished,
		reviewState,
	}
}
