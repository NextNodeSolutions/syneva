import type { ChangeState, Decision, ReviewFile, ReviewState } from '../model'

// The desk's one change set, read once per loaded state: the hub's cut (its ids, spans and order) for every file it diffed, and one whole-file block for each hunk-less add (an untracked file, which git's diff leaves out, so the hub cuts nothing for it - the block is the one Pierre draws for an add).

type ChangeSetInput = Pick<
	ReviewState,
	'mode' | 'files' | 'changes' | 'decisions'
>

// A file desk shows a hunk-less file as a read-only view, never as an add to decide.
function isUncutAdd(file: ReviewFile, cutPaths: ReadonlySet<string>): boolean {
	return (
		!file.hasHunks &&
		file.changeKind === 'added' &&
		file.added > 0 &&
		!cutPaths.has(file.path)
	)
}

// The block's content is the whole file, so the file's content hash is the block's: a rewritten file turns its verdict stale like any block's.
function wholeFileChange(file: ReviewFile): ChangeState {
	const stableKey = `additions:1:0:${file.added}`
	return {
		id: `${file.path}:${stableKey}`,
		path: file.path,
		hunkIndex: 0,
		side: 'additions',
		lineNumber: 1,
		endLine: file.added,
		title: `0 removed · ${file.added} added`,
		stableKey,
		status: 'pending',
		contentHash: file.contentHash,
	}
}

// A record taken on other content than the block holds now no longer speaks for it (the hub drops it on its next rebuild).
function isStale(decision: Decision, change: ChangeState): boolean {
	return (
		!!decision.reviewedHash &&
		!!change.contentHash &&
		decision.reviewedHash !== change.contentHash
	)
}

// The decision records are the verdicts: the hub stamps its change records only when it rebuilds the diff, so a verdict given since (or reset since) lives in the records alone.
function withVerdict(
	change: ChangeState,
	decisions: ReadonlyMap<string, Decision>,
): ChangeState {
	const decision = decisions.get(`${change.path}:${change.stableKey}`)
	if (!decision || isStale(decision, change))
		return { ...change, status: 'pending' }
	return {
		...change,
		status: decision.status,
		reviewedHash: decision.reviewedHash,
	}
}

export function deskChangeSet(state: ChangeSetInput): ChangeState[] {
	const cutPaths = new Set(state.changes.map(change => change.path))
	const wholeFiles =
		state.mode === 'file'
			? []
			: state.files
					.filter(file => isUncutAdd(file, cutPaths))
					.map(wholeFileChange)
	const changes = [...state.changes, ...wholeFiles]
	// A state persisted before decision records existed keeps the statuses the hub stamped.
	if (!state.decisions) return changes
	const decisions = new Map(
		state.decisions.map(decision => [decision.key, decision]),
	)
	return changes.map(change => withVerdict(change, decisions))
}
