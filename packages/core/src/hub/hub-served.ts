// What an open may name, by who asks (RFC 0001, section 7). The machine's own requests (the CLI,
// a local tab) open any folder of the machine. A request the web relayed reviews the code of the
// repositories this hub already serves and nothing more: its root is the root of a live desk -
// the folder that desk's /file and /blob already read under - and every path it names resolves,
// symlinks followed, inside that root. A pr open never comes from the web: it checks the PR out
// in the machine's working tree, which moves HEAD under the agent and runs the hooks of the tree
// it lands on. Checked first, before git runs anywhere for the open.
import path from 'node:path'

import { isWithin } from '../application/containment.js'
import { fileTarget } from '../application/open-desk.js'
import { nowMs } from '../application/time.js'

import { liveDesks, pruneClosed } from './hub-desks.js'

import type { DeskQuery } from '../application/open-desk.js'
import type { WorkspacePort } from '../application/ports.js'
import type { HubFailure, HubState } from './hub.js'

// Who names the folder an open reads: `any` for the machine's own requests, `served` for a
// request the web relayed.
export type OpenScope = 'any' | 'served'

// Null when the open may go on; else why not.
export async function scopeRefusal(
	state: HubState,
	query: DeskQuery,
	scope: OpenScope,
): Promise<HubFailure | null> {
	if (scope === 'any') return null
	if (query.mode === 'pr')
		return {
			ok: false,
			code: 'PR_LOCAL_ONLY',
			reason: "A pr desk opens on the hub's machine only: it checks the PR out in the working tree there.",
		}
	const { workspace } = state.io.git
	const root = await workspace.realpath(query.root)
	if (!root || !(await servedRoots(state)).includes(root))
		return notServed(`${query.root} is not a folder this hub serves.`)
	if (!(await namesWithin(query, root, workspace)))
		return notServed(
			`${namedText(query)} names nothing inside ${query.root}.`,
		)
	return null
}

// The folders the hub serves: its live desks' roots as the filesystem resolves them (a root gone
// from disk serves nothing).
async function servedRoots(state: HubState): Promise<string[]> {
	const desks = liveDesks(pruneClosed(state.desks, nowMs()))
	const roots = await Promise.all(
		desks.map(desk => state.io.git.workspace.realpath(desk.ctx.state.root)),
	)
	return roots.flatMap(root => (root ? [root] : []))
}

// Whether the open's own path resolves within the root, as the build would read it (build.ts): a
// file desk's target, which must exist; a repo desk's scope, and the folder its git is found from
// (the scope itself, or its parent once the scope is gone, a deleted file), read against the
// served root. An open that names no path names nothing outside it.
async function namesWithin(
	query: DeskQuery,
	root: string,
	workspace: WorkspacePort,
): Promise<boolean> {
	if (query.mode === 'file') {
		const named = fileTarget(query)
		const target = named ? await workspace.realpath(named) : null
		return target !== null && isWithin(root, target)
	}
	if (!query.pathFilter) return true
	const scoped = path.resolve(root, query.pathFilter)
	if (!isWithin(root, scoped)) return false
	const found =
		(await workspace.realpath(scoped)) ??
		(await workspace.realpath(path.dirname(scoped))) ??
		root
	return isWithin(root, found)
}

function namedText(query: DeskQuery): string {
	return (query.mode === 'file' ? query.target : query.pathFilter) ?? ''
}

function notServed(reason: string): HubFailure {
	return { ok: false, code: 'NOT_SERVED', reason }
}
