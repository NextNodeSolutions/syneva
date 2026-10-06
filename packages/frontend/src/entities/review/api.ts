import { api } from '@shared/api/client'
import {
	assertObject,
	DecodeError,
	optBoolean,
	optString,
	requiredBoolean,
} from '@shared/api/decode'
import { API_PATHS } from '@syneva/contracts/routes'

import {
	decodeDeskStateSnapshot,
	decodePollPayload,
	decodeReviewState,
} from './decode'

import type { ResetScope } from '@syneva/contracts/review'
import type {
	DeskPollSnapshot,
	DeskRefreshEvent,
	DeskStateSnapshot,
	DeskStatus,
	ReviewState,
	ReviewerSave,
} from './model'

// The only place review-domain endpoints are named; paths from @contracts/routes, every response decoded onto a frontend-owned model - wire shapes never escape.

// Every side-effect POST this entity issues acknowledges with { ok: true }: decode it so a 2xx body that lies still fails here, and no raw wire object escapes the boundary.
function decodeAck(raw: unknown, endpoint: string): void {
	const o = assertObject(raw, endpoint)
	if (!requiredBoolean(o, 'ok', endpoint))
		throw new DecodeError('acknowledgement ok is false', endpoint)
}

export const saveReview = async (payload: ReviewerSave): Promise<void> => {
	decodeAck(
		await api(API_PATHS.save, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
		API_PATHS.save,
	)
}

// The git index follows the decision record - the Decision, not the index, stays the source of truth.
export const stageChange = async (body: unknown): Promise<void> => {
	decodeAck(
		await api(API_PATHS.stage, {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		API_PATHS.stage,
	)
}

export const unstageChange = async (body: unknown): Promise<void> => {
	decodeAck(
		await api(API_PATHS.unstage, {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		API_PATHS.unstage,
	)
}

export type SendResult = { sent?: boolean | undefined }

export const sendReview = async (payload: unknown): Promise<SendResult> => {
	const raw = await api(API_PATHS.send, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
	return {
		sent: optBoolean(
			assertObject(raw, API_PATHS.send),
			'sent',
			API_PATHS.send,
		),
	}
}

export const askAgent = async (body: unknown): Promise<void> => {
	decodeAck(
		await api(API_PATHS.ask, {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		API_PATHS.ask,
	)
}

export type EditorResult = {
	ok?: boolean | undefined
	error?: string | undefined
}

export const openEditor = async (body: {
	path: string
	lineNumber: number
}): Promise<EditorResult> => {
	const raw = await api(API_PATHS.openEditor, {
		method: 'POST',
		body: JSON.stringify(body),
	})
	const o = assertObject(raw, API_PATHS.openEditor)
	return {
		ok: optBoolean(o, 'ok', API_PATHS.openEditor),
		error: optString(o, 'error', API_PATHS.openEditor),
	}
}

export type ResetResult = {
	state: ReviewState
	serverInstanceId?: string | undefined
}

export const resetReview = async (scope: ResetScope): Promise<ResetResult> => {
	const raw = await api(API_PATHS.reset, {
		method: 'POST',
		body: JSON.stringify({ scope }),
	})
	const o = assertObject(raw, API_PATHS.reset)
	// The reset endpoint answers { ok, state, serverInstanceId } - the rebuilt review lives under `state`, not at the top level.
	if (!requiredBoolean(o, 'ok', API_PATHS.reset))
		throw new DecodeError('acknowledgement ok is false', API_PATHS.reset)
	return {
		state: decodeReviewState(o.state, API_PATHS.reset),
		serverInstanceId: optString(o, 'serverInstanceId', API_PATHS.reset),
	}
}

// An unreachable desk resolves like a shutdown.
export const shutdownDesk = async (): Promise<void> => {
	decodeAck(
		await api(API_PATHS.shutdown, { method: 'POST' }),
		API_PATHS.shutdown,
	)
}

export const fetchPoll = async (
	query: string,
): Promise<(DeskPollSnapshot & DeskStatus) | DeskRefreshEvent> => {
	const endpoint = `${API_PATHS.poll}${query}`
	const raw = await api(endpoint)
	return decodePollPayload(raw, endpoint)
}

export const fetchState = async (): Promise<DeskStateSnapshot> => {
	const raw = await api(API_PATHS.state)
	return decodeDeskStateSnapshot(raw, API_PATHS.state)
}
