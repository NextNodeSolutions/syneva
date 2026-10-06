import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredBoolean,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'

import type {
	Journal,
	JournalEvent,
	JournalScope,
	JournalSubject,
	RoundVerdicts,
} from './journal'

const MODES = ['repo', 'file', 'pr'] as const
const KINDS = [
	'desk-opened',
	'desk-reloaded',
	'round-sent',
	'round-picked',
	'question-asked',
	'agent-replied',
	'desk-closed',
] as const

type Wire = Record<string, unknown>

function subjectOf(o: Wire, endpoint: string): JournalSubject {
	return {
		seq: requiredNumber(o, 'seq', endpoint),
		at: requiredString(o, 'at', endpoint),
		deskId: requiredString(o, 'deskId', endpoint),
		projectId: requiredString(o, 'projectId', endpoint),
		project: requiredString(o, 'project', endpoint),
		root: requiredString(o, 'root', endpoint),
		session: requiredString(o, 'session', endpoint),
		mode: enumValue(o.mode, endpoint, MODES, 'event.mode'),
		target: optString(o, 'target', endpoint),
		staged: requiredBoolean(o, 'staged', endpoint),
	}
}

function scopeOf(o: Wire, endpoint: string): JournalScope {
	return {
		files: requiredNumber(o, 'files', endpoint),
		totalChanges: requiredNumber(o, 'totalChanges', endpoint),
	}
}

function verdictsOf(o: Wire, endpoint: string): RoundVerdicts {
	return {
		round: requiredNumber(o, 'round', endpoint),
		accepted: requiredNumber(o, 'accepted', endpoint),
		rejected: requiredNumber(o, 'rejected', endpoint),
		requestedChanges: requiredNumber(o, 'requestedChanges', endpoint),
		openQuestions: requiredNumber(o, 'openQuestions', endpoint),
		approvedFiles: requiredNumber(o, 'approvedFiles', endpoint),
	}
}

// One event, by its kind: each kind's own fields are required, so an event the page cannot
// read whole fails loudly at the boundary instead of rendering half a sentence.
function decodeEvent(raw: unknown, endpoint: string): JournalEvent {
	const o = assertObject(raw, endpoint, 'journal event')
	const subject = subjectOf(o, endpoint)
	const kind = enumValue(o.kind, endpoint, KINDS, 'event.kind')
	if (kind === 'desk-opened' || kind === 'desk-reloaded')
		return { ...subject, ...scopeOf(o, endpoint), kind }
	if (kind === 'round-sent')
		return {
			...subject,
			...scopeOf(o, endpoint),
			...verdictsOf(o, endpoint),
			kind,
		}
	if (kind === 'round-picked')
		return { ...subject, kind, round: requiredNumber(o, 'round', endpoint) }
	if (kind === 'question-asked')
		return {
			...subject,
			kind,
			questions: requiredNumber(o, 'questions', endpoint),
		}
	if (kind === 'agent-replied') return { ...subject, kind }
	return {
		...subject,
		...scopeOf(o, endpoint),
		kind,
		approvedFiles: requiredNumber(o, 'approvedFiles', endpoint),
		decidedChanges: requiredNumber(o, 'decidedChanges', endpoint),
	}
}

export function decodeJournal(raw: unknown, endpoint: string): Journal {
	const o = assertObject(raw, endpoint, 'journal')
	return {
		events: requiredArray(o, 'events', endpoint).map(entry =>
			decodeEvent(entry, endpoint),
		),
		latest: requiredNumber(o, 'latest', endpoint),
		freshAfter: null,
	}
}
