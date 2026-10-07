import { reviewScope } from '../../../../application/desk-summary.js'
import { reloadDesk } from '../../../../application/reload-desk.js'
import { HTTP_OK, HTTP_UNPROCESSABLE, readBody, json, fail } from '../http.js'

import type { ApiFailure } from '../failure.js'
import type { RouteRequest } from '../router.js'

export async function reloadDeskFromRequest({
	ctx,
	req,
	res,
}: RouteRequest): Promise<void> {
	await ctx.serialize(async (): Promise<void> => {
		const outcome = await reloadDesk(
			ctx.state,
			ctx.pathFilter,
			{ git: ctx.git, store: ctx.store },
			guideSwapOf(await readBody(req)),
		)
		if (outcome.kind === 'invalid-guide')
			return fail(res, invalidGuide(outcome.reason))
		ctx.commit(outcome.state)
		ctx.recordEvent({
			kind: 'desk-reloaded',
			...reviewScope(outcome.state),
		})
		json(res, HTTP_OK, {
			ok: true,
			empty: outcome.kind === 'empty',
			baseDiffHash: outcome.baseDiffHash,
		})
	})
}

function invalidGuide(reason: string): ApiFailure {
	return {
		status: HTTP_UNPROCESSABLE,
		code: 'INVALID_GUIDE',
		error: `Invalid guide: ${reason}.`,
		fix: 'Run `syneva spec` for the guided-review schema.',
	}
}

// Empty, non-JSON, or no `guide` key means "keep the guide I have" (legacy callers post nothing, the CLI omits the key); a present key is validated by the use case.
function guideSwapOf(rawBody: string): { guide: unknown } | undefined {
	if (!rawBody) return undefined
	let parsed: unknown
	try {
		parsed = JSON.parse(rawBody)
	} catch {
		return undefined // tolerate empty/non-JSON bodies (legacy callers)
	}
	if (typeof parsed !== 'object' || parsed === null || !('guide' in parsed))
		return undefined
	// A posted `guide: null` IS a posted (invalid) guide, not an absent one - hence the wrapper object rather than a bare value.
	return { guide: parsed.guide }
}
