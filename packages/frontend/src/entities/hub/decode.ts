import {
	assertObject,
	enumValue,
	optString,
	requiredBoolean,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'
import { LOCAL_HUB_ID } from '@syneva/contracts/bridge'

import { scopedId } from './hub-ids'

import type { StreamFrame } from '@shared/api/stream-frame'
import type { HubDesk, HubHealth, HubIdentity, HubRef, WebMe } from './model'

// The review modes a desk can be in, as the wire names them (the journal's events carry them
// too).
export const MODES = ['repo', 'file', 'pr'] as const

// Required fields fail loudly with a named boundary error; unknown response properties are ignored by construction, so a newer hub stays usable.
// `hubId`: the hub whose `desk` frame (or open) carried it; its projects are scoped by it.
export function decodeHubDesk(
	raw: unknown,
	endpoint: string,
	hubId: string = LOCAL_HUB_ID,
): HubDesk {
	const o = assertObject(raw, endpoint, 'desk')
	return {
		id: requiredString(o, 'id', endpoint),
		root: requiredString(o, 'root', endpoint),
		project: requiredString(o, 'project', endpoint),
		projectId: scopedId(hubId, requiredString(o, 'projectId', endpoint)),
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
		plan: optString(o, 'plan', endpoint) ?? null,
		hubId,
		// Resolved by the stream's store, which knows its hubs.
		hub: null,
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

export function decodeHubIdentity(raw: unknown, endpoint: string): HubIdentity {
	const o = assertObject(raw, endpoint, 'hub identity')
	return {
		id: requiredString(o, 'id', endpoint),
		name: requiredString(o, 'name', endpoint),
		version: requiredString(o, 'version', endpoint),
		instanceId: requiredString(o, 'instanceId', endpoint),
		startedAt: requiredString(o, 'startedAt', endpoint),
	}
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

function lastSeen(at: string | null | undefined): number | null {
	const seen = Date.parse(at ?? '')
	if (Number.isNaN(seen)) return null
	return seen
}

// A `hub` frame: where one of the person's paired hubs stands (the web's object sends it). The
// time the web last saw it is epoch ms here; one that does not read as a time is not known.
export function decodeHubPresence(
	frame: Extract<StreamFrame, { t: 'hub' }>,
): Omit<HubRef, 'id'> & { hubId: string } {
	return {
		hubId: frame.hubId,
		name: frame.name,
		isOnline: frame.online,
		version: frame.version ?? null,
		lastSeenAt: lastSeen(frame.lastSeenAt),
	}
}

export function decodeWebMe(raw: unknown, endpoint: string): WebMe {
	const o = assertObject(raw, endpoint, 'web session')
	return {
		userId: requiredString(o, 'userId', endpoint),
		email: requiredString(o, 'email', endpoint),
	}
}
