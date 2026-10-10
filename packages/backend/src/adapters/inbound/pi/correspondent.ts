import { readFile } from 'node:fs/promises'

import { API_PATHS } from '@syneva/contracts/routes'

import { runCorrespondent } from './pi-thread.js'

import type { DeskConnection, DeskTarget } from './desk-connection.js'

// Desk-event semantics re-exported by the delivery layer; the mechanism (spawning and reading one pi thread) stays in this file.
export type LineQuestion = {
	path: string
	lineNumber: number
	side: 'additions' | 'deletions'
	body: string
	mode?: string
}

// A question on the guide's explanation of a domain or a block: answered from the code the refs name, replied into that thread.
export type DomainQuestion = {
	anchor: 'domain'
	domainId: string
	blockId?: string | undefined
	domainTitle?: string | undefined
	blockTitle?: string | undefined
	refs?: unknown
	body: string
	mode?: string
}

export type DeskQuestion = LineQuestion | DomainQuestion

export type CorrespondentIo = {
	readQuestions: (eventPath: string) => Promise<DeskQuestion[]>
	runCorrespondent: (
		connection: DeskConnection,
		prompt: string,
		signal: AbortSignal,
	) => Promise<string>
	postDeskComment: (
		desk: DeskConnection,
		question: DeskQuestion,
		body: string,
	) => Promise<void>
}

const POST_COMMENT_TIMEOUT_MS = 10_000
// Answers are prose; the cap only guards against runaway output before the parser sees it.

export function buildCorrespondentPrompt(
	target: DeskTarget,
	questions: DeskQuestion[],
): string {
	const count = questions.length
	return [
		`Syneva review question for repo ${JSON.stringify(target.repo)}, session ${JSON.stringify(target.session)}.`,
		`Questions in order: ${JSON.stringify(questions)}`,
		`Answer ${count === 1 ? 'it' : `all ${count} of them`} read-only: read the anchored code as needed to answer, never edit files, never run desk commands.`,
		'A question whose anchor is "domain" is about the review guide\'s explanation of that domain or block (its title and the code refs are in the JSON): answer from the code the refs point at and from the repository; the guide lives in the desk, not on disk, and you cannot change it.',
		"Answer in the reviewer's language.",
		'Reply format - for each question in order, emit exactly:',
		'### q<N>',
		'<the answer, plain text>',
		'Nothing before the first block, nothing after the last.',
	].join('\n')
}

export function buildCorrectivePrompt(count: number): string {
	return [
		'Your previous reply was not in the required format.',
		`Re-emit the answers now: for each of the ${count} question(s) in order, exactly:`,
		'### q<N>',
		'<the answer, plain text>',
		'Nothing else in the reply.',
	].join('\n')
}

// Replies parse out of "### q<N>" blocks, one per question, in question order; the anchor is NOT taken from the reply (the desk envelope owns path/line/side) - only the body is read here; extra blocks tolerated, missing or empty throw.
export function parseCorrespondentReply(text: string, count: number): string[] {
	const marks = [...text.matchAll(/^###\s*q(\d+)\s*$/gm)]
	const bodies = new Map<number, string>()
	for (const [index, mark] of marks.entries()) {
		const [blockNumberText] = mark.slice(1)
		const blockNumber = Number(blockNumberText)
		if (bodies.has(blockNumber))
			throw new Error(
				`the correspondent reply repeats block q${blockNumber}`,
			)
		const following = marks.at(index + 1)
		const start = mark.index + mark[0].length
		const end = following ? following.index : undefined
		bodies.set(blockNumber, text.slice(start, end).trim())
	}
	const replies: string[] = []
	for (let position = 1; position <= count; position++) {
		if (!bodies.has(position))
			throw new Error(
				`the correspondent reply is missing block q${position}`,
			)
		const body = bodies.get(position) ?? ''
		if (!body)
			throw new Error(
				`the correspondent reply block q${position} is empty`,
			)
		replies.push(body)
	}
	return replies
}

// The saved event envelope is ground truth for path/lineNumber/side, never the reply; accepts the batched `questions[]` and the single-`question` compatibility field.
export async function readQuestions(
	eventPath: string,
): Promise<DeskQuestion[]> {
	const envelope: unknown = JSON.parse(await readFile(eventPath, 'utf8'))
	if (typeof envelope !== 'object' || envelope === null) return []
	return questionListOf(envelope).filter(isDeskQuestion)
}

function questionListOf(scope: object): unknown[] {
	if ('questions' in scope && Array.isArray(scope.questions))
		return scope.questions
	if ('question' in scope && isDeskQuestion(scope.question))
		return [scope.question]
	return []
}

function isDeskQuestion(candidate: unknown): candidate is DeskQuestion {
	if (typeof candidate !== 'object' || candidate === null) return false
	if (!('body' in candidate) || typeof candidate.body !== 'string')
		return false
	if ('anchor' in candidate && candidate.anchor === 'domain')
		return 'domainId' in candidate && typeof candidate.domainId === 'string'
	return (
		'path' in candidate &&
		typeof candidate.path === 'string' &&
		'lineNumber' in candidate &&
		typeof candidate.lineNumber === 'number' &&
		'side' in candidate &&
		(candidate.side === 'additions' || candidate.side === 'deletions')
	)
}

// The reply lands where the question was asked: a line thread or a guide thread.
function replyBody(
	question: DeskQuestion,
	body: string,
): Record<string, unknown> {
	if ('anchor' in question)
		return {
			domainId: question.domainId,
			blockId: question.blockId,
			body,
			role: 'agent',
		}
	return {
		path: question.path,
		side: question.side,
		lineNumber: question.lineNumber,
		body,
		role: 'agent',
	}
}

// Same wire shape the `syneva comment` CLI posts, so replies show up live in the desk.
export async function postDeskComment(
	desk: DeskConnection,
	question: DeskQuestion,
	body: string,
): Promise<void> {
	const headers: Record<string, string> = {
		'content-type': 'application/json',
	}
	if (desk.key) headers.authorization = `Bearer ${desk.key}`
	const response = await fetch(`${desk.url}${API_PATHS.comment}`, {
		method: 'POST',
		signal: AbortSignal.timeout(POST_COMMENT_TIMEOUT_MS),
		redirect: 'error',
		headers,
		body: JSON.stringify(replyBody(question, body)),
	})
	if (!response.ok)
		throw new Error(
			`POST ${API_PATHS.comment} failed: HTTP ${response.status}`,
		)
}

// Default wiring used by the live attachment; tests inject fakes instead.
export const correspondentIo: CorrespondentIo = {
	readQuestions,
	runCorrespondent,
	postDeskComment,
}
