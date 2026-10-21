import {
	stageChange,
	stagePaths,
	unstagePath,
} from '../../application/staging.js'
import { HTTP_CONFLICT, HTTP_OK, readJsonBody, json, fail } from '../http.js'

import type {
	StageChangeRequest,
	StagePathsRequest,
} from '../../application/staging.js'
import type { ApiFailure } from '../failure.js'
import type { RouteRequest } from '../router.js'

// PR changes are committed: accept/reject are approve/request-changes verdicts, so there is nothing to stage; both staging routes refuse identically.
const STAGING_DISABLED: ApiFailure = {
	status: HTTP_CONFLICT,
	code: 'STAGING_DISABLED',
	error: 'Staging is unavailable in PR review mode.',
	fix: 'PR changes are committed; accept/reject are approve/request-changes verdicts.',
}

// A hub whose GitPort has no staging (desks over a branch, not a clone) refuses every staging
// route, /unstage included, with the same code: these routes are the browser's alone (not in the
// agent contract), and the Decision records stay the verdict either way.
const NO_STAGING: ApiFailure = {
	status: HTTP_CONFLICT,
	code: 'STAGING_DISABLED',
	error: 'Staging is unavailable on this hub: its desks read a branch, not a working tree.',
	fix: 'Accept and reject still record the verdict; there is no index to stage it in.',
}

export async function stageFiles({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	if (ctx.state.mode === 'pr') return fail(STAGING_DISABLED)
	const { staging } = ctx.git
	if (!staging) return fail(NO_STAGING)
	return ctx.serialize(async (): Promise<Response> => {
		const body: unknown = await readJsonBody(request)
		// stagePaths returns the next root (the same one when nothing changed); persist + commit is what publishes it.
		const next = await stagePaths(
			ctx.state,
			parseStagePathsRequest(body),
			staging,
		)
		const saved = await ctx.persist(next)
		ctx.commit(saved.state)
		return json(HTTP_OK, { ok: true })
	})
}

export async function stageOneChange({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	if (ctx.state.mode === 'pr') return fail(STAGING_DISABLED)
	const { staging } = ctx.git
	if (!staging) return fail(NO_STAGING)
	return ctx.serialize(async (): Promise<Response> => {
		const body: unknown = await readJsonBody(request)
		const outcome = await stageChange(
			ctx.state,
			parseStageChangeRequest(body),
			staging,
		)
		if (outcome.decision === 'conflict')
			return fail({
				status: HTTP_CONFLICT,
				code: 'PATCH_CONFLICT',
				error: outcome.message,
				fix: 'The working tree changed since the desk loaded. Reload it (GET /state) and retry.',
			})
		if (outcome.decision === 'staged') {
			const saved = await ctx.persist(outcome.state)
			ctx.commit(saved.state)
		}
		return json(HTTP_OK, { ok: true, skipped: outcome.skipped })
	})
}

export async function unstageFile({
	ctx,
	request,
}: RouteRequest): Promise<Response> {
	const { staging } = ctx.git
	if (!staging) return fail(NO_STAGING)
	return ctx.serialize(async (): Promise<Response> => {
		const body: unknown = await readJsonBody(request)
		const next = await unstagePath(
			ctx.state,
			parseUnstageRequest(body),
			staging,
		)
		const saved = await ctx.persist(next)
		ctx.commit(saved.state)
		return json(HTTP_OK, { ok: true })
	})
}

// `{ path }` (compat) or `{ paths }` (a move pair in one `git add`); the recorded review path is the explicit `path`, else the LAST of `paths` - approveCurrentFile sends [old, new], so the entry that survives the rename is the one recorded.
function parseStagePathsRequest(payload: unknown): StagePathsRequest {
	if (typeof payload !== 'object' || payload === null) return { paths: [] }
	const single =
		'path' in payload && typeof payload.path === 'string'
			? payload.path
			: undefined
	const postedPaths: unknown[] | undefined =
		'paths' in payload && Array.isArray(payload.paths)
			? payload.paths
			: undefined
	const posted = postedPaths?.filter(
		candidate => typeof candidate === 'string',
	)
	const paths = posted ?? (single ? [single] : [])
	return { paths, recorded: single ?? paths.at(-1) }
}

function parseStageChangeRequest(payload: unknown): StageChangeRequest {
	if (typeof payload !== 'object' || payload === null)
		return { path: '', stableKey: '' }
	return {
		path:
			'path' in payload && typeof payload.path === 'string'
				? payload.path
				: '',
		stableKey:
			'stableKey' in payload && typeof payload.stableKey === 'string'
				? payload.stableKey
				: '',
	}
}

function parseUnstageRequest(payload: unknown): string {
	if (typeof payload !== 'object' || payload === null) return ''
	return 'path' in payload && typeof payload.path === 'string'
		? payload.path
		: ''
}
