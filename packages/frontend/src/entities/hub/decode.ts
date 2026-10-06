import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredBoolean,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'

import type { HubDesk, HubHealth } from './model'

// The review modes a desk can be in, as the wire names them (the journal's events carry them
// too).
export const MODES = ['repo', 'file', 'pr'] as const

// The hub listing's wire→model mapper: required fields fail loudly with a named boundary
// error; unknown response properties are ignored by construction, so a newer hub stays usable.
export function decodeHubDesk(raw: unknown, endpoint: string): HubDesk {
	const o = assertObject(raw, endpoint, 'desk')
	return {
		id: requiredString(o, 'id', endpoint),
		root: requiredString(o, 'root', endpoint),
		project: requiredString(o, 'project', endpoint),
		projectId: requiredString(o, 'projectId', endpoint),
		session: requiredString(o, 'session', endpoint),
		mode: enumValue(o.mode, endpoint, MODES, 'desk.mode'),
		target: optString(o, 'target', endpoint),
		staged: requiredBoolean(o, 'staged', endpoint),
		baseDiffHash: requiredString(o, 'baseDiffHash', endpoint),
		empty: requiredBoolean(o, 'empty', endpoint),
		files: requiredNumber(o, 'files', endpoint),
		approvedFiles: requiredNumber(o, 'approvedFiles', endpoint),
		totalChanges: requiredNumber(o, 'totalChanges', endpoint),
		decidedChanges: requiredNumber(o, 'decidedChanges', endpoint),
		openQuestions: requiredNumber(o, 'openQuestions', endpoint),
		openRequests: requiredNumber(o, 'openRequests', endpoint),
		agentListening: requiredBoolean(o, 'agentListening', endpoint),
		agentActivity: decodeActivity(o.agentActivity, endpoint),
		queuedQuestions: requiredNumber(o, 'queuedQuestions', endpoint),
		queuedReviews: requiredNumber(o, 'queuedReviews', endpoint),
		openedAt: requiredString(o, 'openedAt', endpoint),
		lastActivityAt: requiredString(o, 'lastActivityAt', endpoint),
		path: requiredString(o, 'path', endpoint),
	}
}

function decodeActivity(
	raw: unknown,
	endpoint: string,
): HubDesk['agentActivity'] {
	if (!raw) return null
	const a = assertObject(raw, endpoint, 'agentActivity')
	return {
		body: requiredString(a, 'body', endpoint),
		at: requiredString(a, 'at', endpoint),
	}
}

export function decodeHubDesks(raw: unknown, endpoint: string): HubDesk[] {
	const o = assertObject(raw, endpoint, 'desk listing')
	return requiredArray(o, 'desks', endpoint).map(entry =>
		decodeHubDesk(entry, endpoint),
	)
}

export function decodeHubHealth(raw: unknown, endpoint: string): HubHealth {
	const o = assertObject(raw, endpoint, 'hub health')
	return {
		version: requiredString(o, 'version', endpoint),
		instanceId: requiredString(o, 'instanceId', endpoint),
		startedAt: requiredString(o, 'startedAt', endpoint),
		desks: requiredNumber(o, 'desks', endpoint),
		keyRequired: requiredBoolean(o, 'keyRequired', endpoint),
	}
}
