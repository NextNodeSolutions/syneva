import { stageChange, unstageChange } from '@entities/review/api'
import {
	currentFile,
	fileObjections,
	flowIndex,
} from '@entities/review/changes'
import { guideInputs, guideProgress } from '@entities/review/guide/guide'
import { featureCtx } from '@features/context'
import { render, deferRender } from '@shared/lib/render-scheduler'

import type { ChangeState, Decision, ReviewFile } from '@entities/review/model'

// The explicit decision record is the source of truth for accept/reject (decoupled from git staging): every status change goes through these so it survives reload.
function recordDecision(change: ChangeState, status: Decision['status']): void {
	const state = featureCtx().requireState()
	state.decisions = state.decisions ?? []
	const key = `${change.path}:${change.stableKey}`
	const entry: Decision = {
		key,
		status,
		reviewedHash: change.contentHash,
		path: change.path,
		lineNumber: change.lineNumber,
		side: change.side,
		title: change.title,
	}
	const i = state.decisions.findIndex(d => d.key === key)
	if (i >= 0) state.decisions[i] = entry
	else state.decisions.push(entry)
}

function clearDecisions(path: string): void {
	const state = featureCtx().requireState()
	state.decisions = (state.decisions ?? []).filter(d => d.path !== path)
}

function acceptPendingChanges(path: string): void {
	const state = featureCtx().requireState()
	for (const change of state.changes) {
		if (change.path !== path || change.status !== 'pending') continue
		change.status = 'accepted'
		change.reviewedHash = change.contentHash
		recordDecision(change, 'accepted')
	}
}

function markFileReviewed(path: string, contentHash: string): void {
	const state = featureCtx().requireState()
	state.decisionFiles = state.decisionFiles ?? []
	if (!state.decisionFiles.includes(path)) state.decisionFiles.push(path)
	if (!state.reviewedFiles.includes(path)) state.reviewedFiles.push(path)
	state.reviewedFileHashes = state.reviewedFileHashes ?? {}
	state.reviewedFileHashes[path] = contentHash
}

async function stageApprovedFile(
	file: ReviewFile,
	path: string,
): Promise<void> {
	const state = featureCtx().requireState()
	const moved = file.oldPath && file.newPath && file.oldPath !== file.newPath
	const pairMove = moved && state.mode === 'repo' && !state.staged
	const body = pairMove ? { paths: [file.oldPath, path] } : { path }
	await stageChange(body)
	if (!state.stagedFiles.includes(path)) state.stagedFiles.push(path)
}

export async function approveCurrentFile(): Promise<void> {
	const file = currentFile(
		featureCtx().S.state?.files,
		featureCtx().S.preview,
		featureCtx().S.fileIndex,
	)
	const { path } = file
	const state = featureCtx().requireState()
	acceptPendingChanges(path)
	markFileReviewed(path, file.contentHash)
	const isClean = !fileObjections(featureCtx().S.state, path)
	if (isClean && featureCtx().S.settings.stageOnAccept)
		await stageApprovedFile(file, path)
	featureCtx().persist()
	const label = isClean ? 'Approved' : 'Marked reviewed'
	const ix = flowIndex(featureCtx().S.state, {
		distill: featureCtx().S.settings.hideReviewed,
	})
	const scope = state.files.filter(f => !ix.outOfFlow.has(f.path))
	if (scope.every(f => state.reviewedFiles.includes(f.path))) {
		featureCtx().toast(`${label} - review complete`)
		void render()
		featureCtx().S.promptFinish?.()
		return
	}
	const done = scope.filter(f => ix.reviewState(f.path) !== 'pending').length
	featureCtx().toast(
		`${label} - ${done} of ${scope.length} files · ${guideProgress(guideInputs(featureCtx().S)).pct}%`,
	)
	void render()
	featureCtx().S.afterSignOff?.(path)
}

// Best-effort unstage: fired without blocking so the re-render (and its indicator) starts immediately, a failed index op swallowed.
async function unstagePath(path: string): Promise<void> {
	try {
		await unstageChange({ path })
	} catch {
		/* the reviewer-facing state is already reset above; the next decision re-stages */
	}
}

export async function resetReview(path: string): Promise<void> {
	const state = featureCtx().requireState()
	for (const change of state.changes)
		if (change.path === path) change.status = 'pending'
	clearDecisions(path)
	state.stagedChangeKeys = (state.stagedChangeKeys ?? []).filter(
		k => !k.startsWith(`${path}:`),
	)
	state.decisionFiles = (state.decisionFiles ?? []).filter(p => p !== path)
	state.reviewedFiles = state.reviewedFiles.filter(p => p !== path)
	const hashes = state.reviewedFileHashes ?? {}
	state.reviewedFileHashes = Object.fromEntries(
		Object.entries(hashes).filter(([hashedPath]) => hashedPath !== path),
	)
	state.stagedFiles = state.stagedFiles.filter(p => p !== path)
	await unstagePath(path)
	deferRender()
	featureCtx().toast('Reset review')
	featureCtx().persist()
}

export async function rejectFile(path: string): Promise<void> {
	const state = featureCtx().requireState()
	const blocks = state.changes.filter(c => c.path === path)
	if (!blocks.length) return
	for (const change of blocks) {
		change.status = 'rejected'
		change.reviewedHash = change.contentHash
		recordDecision(change, 'rejected')
	}
	state.decisionFiles = state.decisionFiles ?? []
	if (!state.decisionFiles.includes(path)) state.decisionFiles.push(path)
	featureCtx().toast('Rejected file')
	void render()
	featureCtx().persist()
}

// Per-hunk accept/reject is a pure verdict - staging happens only when the file is approved, so a changes-requested file is never left partially staged.
export async function acceptChange(
	id: string,
	status: Decision['status'],
): Promise<void> {
	const state = featureCtx().requireState()
	const change = state.changes.find(c => c.id === id)
	if (!change || change.status === status) return
	change.status = status
	change.reviewedHash = change.contentHash
	recordDecision(change, status)
	state.decisionFiles = state.decisionFiles ?? []
	if (!state.decisionFiles.includes(change.path))
		state.decisionFiles.push(change.path)
	featureCtx().toast(status === 'rejected' ? 'Rejected' : 'Accepted')
	void render()
	featureCtx().persist()
}
