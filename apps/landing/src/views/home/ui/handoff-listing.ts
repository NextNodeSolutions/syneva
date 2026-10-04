import { mapClasses } from '@shared/lib/map-classes'

import { json } from './handoff.styles'

import type { AwaitEvent, ReviewResult } from '@syneva/contracts/agent'

// The review event the handoff figure prints, as fenced JSON. It stays an
// HTML string because its whitespace is part of the content; plain classes
// name its tokens and mapClasses() swaps them for the StyleX ones. A line
// that carries a verdict is tinted by its kind.
type LineKind = 'yes' | 'no' | 'ask'
// Every field name it prints comes from the contract the CLI emits, so a
// rename there fails this build.
type ReviewEvent = Extract<AwaitEvent, { kind: 'review' }>
type ContractKey =
	| keyof ReviewEvent
	| keyof ReviewResult
	| keyof ReviewResult['accepted'][number]
	| keyof ReviewResult['requestedChanges'][number]

const key = (name: ContractKey): string =>
	`<span class="j-key">"${name}"</span>`
const text = (content: string): string =>
	`<span class="j-string">"${content}"</span>`
const number = (digits: string): string =>
	`<span class="j-number">${digits}</span>`
const punctuation = (marks: string): string =>
	`<span class="j-punctuation">${marks}</span>`
const line = (body: string, kind?: LineKind): string =>
	`<span class="j-line${kind ? ` is-${kind}` : ''}">${body}</span>`

const LISTING = [
	line(
		`${punctuation('{')} ${key('kind')}${punctuation(':')} ${text('review')}${punctuation(',')} ${key('result')}${punctuation(': {')}`,
	),
	line(
		`  ${key('mode')}${punctuation(':')} ${text('repo')}${punctuation(',')}`,
	),
	line(
		`  ${key('accepted')}${punctuation(': [{')} ${key('path')}${punctuation(':')} ${text('auth/session.ts')}${punctuation(',')} ${key('lineNumber')}${punctuation(':')} ${number('14')}${punctuation(',')}`,
		'yes',
	),
	line(
		`      ${key('side')}${punctuation(':')} ${text('additions')}${punctuation(',')} ${key('title')}${punctuation(':')} ${text('Verify the session first')} ${punctuation('}],')}`,
		'yes',
	),
	line(
		`  ${key('rejected')}${punctuation(': [{')} ${key('path')}${punctuation(':')} ${text('pages/desk.tsx')}${punctuation(',')} ${key('lineNumber')}${punctuation(':')} ${number('41')}${punctuation(', … }],')}`,
		'no',
	),
	line(
		`  ${key('requestedChanges')}${punctuation(': [{')} ${key('path')}${punctuation(':')} ${text('api/middleware.ts')}${punctuation(',')} ${key('lineNumber')}${punctuation(':')} ${number('20')}${punctuation(',')}`,
		'ask',
	),
	line(
		`      ${key('body')}${punctuation(':')} ${text('Log why the session was rejected.')} ${punctuation('}],')}`,
		'ask',
	),
	line(
		`  ${key('approvedFiles')}${punctuation(': [')}${text('contracts/review.ts')}${punctuation(',')} ${text('lib/hash.ts')}${punctuation('],')}`,
	),
	line(`  ${key('openQuestions')}${punctuation(': [],')}`),
	line(
		`  ${key('overallNote')}${punctuation(':')} ${text('Run the formatter after.')}`,
	),
	line(punctuation('} }')),
].join('')

export const HANDOFF_LISTING = mapClasses(LISTING, {
	'j-line': json.line,
	'is-yes': json.yes,
	'is-no': json.no,
	'is-ask': json.ask,
	'j-key': json.key,
	'j-string': json.string,
	'j-number': json.number,
	'j-punctuation': json.punctuation,
})
