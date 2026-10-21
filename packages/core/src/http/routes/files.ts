import { NoWorkingTreeError } from '../../application/capabilities.js'
import { resolveContained } from '../../application/containment.js'
import { readFileContents } from '../../application/contents.js'
import { errorMessage } from '../../application/errors.js'
import { readReviewedSide } from '../../application/guide-context.js'
import { blobOid } from '../../domain/identity.js'
import { BAD_PATH, cannotRead } from '../failure.js'
import { HTTP_NOT_FOUND, HTTP_OK, json, fail } from '../http.js'

import type { ContainedPath } from '../../application/containment.js'
import type { WorkspacePort } from '../../application/ports.js'
import type { RouteRequest } from '../router.js'

// GET /file - read an arbitrary repo file, for previewing/commenting on unchanged files; same strict path boundary as /file-contents (repo-relative, no escapes).
// Without `side`, the working tree as it is now; with one (a cited guide reference), that side as the review took it - the index or a commit on a staged or pr desk - so the preview shows the lines the reference resolved against.
export async function serveFile({ ctx, url }: RouteRequest): Promise<Response> {
	const rel = url.searchParams.get('path') ?? ''
	const resolved = await resolveContained(
		ctx.state.root,
		rel,
		ctx.git.workspace,
	)
	if ('error' in resolved && resolved.error === 'escape')
		return fail(BAD_PATH)
	const side = url.searchParams.get('side')
	const contents =
		side === 'additions' || side === 'deletions'
			? await readReviewedSide(ctx.state, rel, side, ctx.git)
			: await readWorkingFile(resolved, ctx.git.workspace)
	if (contents === null) return fail(cannotRead(rel))
	return json(HTTP_OK, { path: rel, contents })
}

async function readWorkingFile(
	resolved: ContainedPath,
	workspace: WorkspacePort,
): Promise<string | null> {
	if (!('abs' in resolved)) return null
	return workspace.readFile(resolved.abs)
}

// GET /file-contents - one reviewed file's old/new contents, fetched on demand so the full contents never ride /state; resolved from git/the working tree (the state embeds none).
export async function serveFileContents({
	ctx,
	url,
}: RouteRequest): Promise<Response> {
	const rel = url.searchParams.get('path') ?? ''
	// One capture: the file lookup and the content read must come from one state root - a commit landing between them would resolve the file against one diff and its bytes against another.
	const { state } = ctx
	const resolved = await resolveContained(state.root, rel, ctx.git.workspace)
	// Only an ESCAPE is fatal here: a "missing" working-tree file is legitimate - the old/new bytes may come from git (a deleted or index-only file has no working-tree path).
	if ('error' in resolved && resolved.error === 'escape')
		return fail(BAD_PATH)
	const file = state.files.find(candidate => candidate.path === rel)
	if (!file)
		return fail({
			status: HTTP_NOT_FOUND,
			code: 'NOT_FOUND',
			error: `"${rel}" is not part of this review.`,
			fix: 'Reload the desk (GET /state) if the diff changed.',
		})
	try {
		// newOid is the file-level staleness key (the new-side blob OID); oldOid is hashed locally from the resolved old side. Carried for a future client cache - the tab ignores them now.
		const { oldContents, newContents } = await readFileContents(
			state,
			file,
			ctx.git,
		)
		return json(HTTP_OK, {
			path: rel,
			oldContents,
			newContents,
			oldOid: blobOid(oldContents),
			newOid: file.contentHash || blobOid(newContents),
		})
	} catch (error) {
		// A desk at odds with its hub is not a missing object: the router's mapping answers it.
		if (error instanceof NoWorkingTreeError) throw error
		// A git object that can't be read (e.g. rewritten/dropped by a rebase mid-session).
		return fail({
			status: HTTP_NOT_FOUND,
			code: 'NOT_FOUND',
			error: `Could not read contents for "${rel}": ${errorMessage(error)}`,
			fix: 'The desk may be stale after a rebase - reload it (GET /state).',
		})
	}
}
