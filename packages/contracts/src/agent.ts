import type { ReviewMode } from './review.js'

export type ReviewResult = {
	session: string
	repoRoot: string
	mode: ReviewMode
	target?: string | undefined
	base?: string | undefined
	staged: boolean
	head: string | null
	baseDiffHash: string
	accepted: Array<{
		path: string
		lineNumber: number
		side: string
		title: string
	}>
	rejected: Array<{
		path: string
		lineNumber: number
		side: string
		title: string
	}>
	requestedChanges: Array<{
		path: string
		lineNumber: number
		side: string
		body: string
		// 'file': whole-file remark (no line to edit); absent means line-anchored.
		anchor?: 'file' | undefined
	}>
	// Ephemeral per Send - never persisted into the review state, so it cannot silently re-send.
	overallNote?: string | undefined
	stagedFiles: readonly string[]
	// Sign-off currently valid: no rejected hunks, no open requested-change comments.
	approvedFiles: string[]
	// Missed-live questions folded into the round: answer each via `syneva comment`; answering is read-only.
	openQuestions: QuestionPayload[]
	artifacts: { resultJson: string; sessionDir: string }
}

export type QuestionPayload = {
	path: string
	lineNumber: number
	side: 'additions' | 'deletions'
	body: string
	// 'file' anchors the file header: reply via comment --path <f> --line 0.
	anchor?: 'file' | undefined
	mode: ReviewMode
	session: string
}

// Question: answer now via `syneva comment`; review: act on the Send; closed: the human ended the review.
export type AwaitEvent =
	| { kind: 'review'; result: ReviewResult }
	// question is the oldest of the batch (compat); questions lists every question in arrival order - read the array.
	| {
			kind: 'question'
			question: QuestionPayload
			questions: QuestionPayload[]
	  }
	// Emitted just before the desk exits so a parked waiter learns why; live-missed Sends survive in artifacts.resultJson.
	| { kind: 'closed'; session: string }
