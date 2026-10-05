import { errorMessage } from './errors.js'

import type { ReviewMode } from '../domain/review.js'
import type { GitPort } from './ports.js'

export type PrTarget = { target: string | undefined; base: string | undefined }

export type PrTargetOutcome =
	| { ok: true; target: PrTarget }
	| { ok: false; reason: string }

type PrInfo = { headRefName: string; baseRefName: string }

// A `pr` target is a PR number (`123`) or a GitHub PR URL when it matches these; anything else is
// treated as a plain branch name.
export function isPrRef(ref: string): boolean {
	return (
		/^\d+$/.test(ref) ||
		/^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(ref)
	)
}

// PR mode targets a branch by default; a numeric ref or GitHub PR URL is resolved to its
// head/base branches via the GitHub CLI and checked out. Non-PR modes pass the target through
// untouched. A failure is a reason, never a thrown error: the hub answers it as a 422 and the
// CLI prints it - the desk is simply not opened.
export type PrTargetQuery = {
	mode: ReviewMode
	target: string | undefined
	base: string | undefined
	root: string
}

export async function resolvePrTarget(
	query: PrTargetQuery,
	git: GitPort,
): Promise<PrTargetOutcome> {
	const { mode, target, base, root } = query
	if (mode !== 'pr' || !target) return { ok: true, target: { target, base } }
	const dirty = await git
		.run(['status', '--porcelain', '--untracked-files=no'], root)
		.catch(() => '')
	if (dirty.trim())
		return {
			ok: false,
			reason: `Working tree has uncommitted changes to tracked files. Commit or stash them before reviewing a PR (no checkout performed):\n${dirty}`,
		}
	if (isPrRef(target)) return resolvePrNumber(target, root, base, git)
	return checkoutBranch(target, root, base, git)
}

async function resolvePrNumber(
	ref: string,
	root: string,
	base: string | undefined,
	git: GitPort,
): Promise<PrTargetOutcome> {
	try {
		const prInfo = await fetchPrInfo(ref, root, git)
		await git.gh(['pr', 'checkout', ref], root)
		return {
			ok: true,
			target: {
				target: prInfo.headRefName,
				base:
					base ??
					(await resolveRemoteBase(prInfo.baseRefName, root, git)),
			},
		}
	} catch (error) {
		return { ok: false, reason: errorMessage(error) }
	}
}

async function fetchPrInfo(
	ref: string,
	root: string,
	git: GitPort,
): Promise<PrInfo> {
	let raw: string
	try {
		raw = await git.gh(
			['pr', 'view', ref, '--json', 'headRefName,baseRefName'],
			root,
		)
	} catch (error) {
		throw new Error(
			`Could not resolve PR "${ref}" via the GitHub CLI. Install gh and run \`gh auth login\`, or pass a branch name instead.\n${errorMessage(error)}`,
			{ cause: error },
		)
	}
	const prInfo = readPrInfo(JSON.parse(raw))
	if (!prInfo)
		throw new Error(`PR "${ref}" did not resolve to a head/base branch.`)
	return prInfo
}

// `gh pr checkout` updates HEAD but never refreshes the base branch, so a merge-base against a
// stale local base makes a long-lived PR show unrelated mainline commits. Refresh the base ref
// and prefer the remote-tracking tip, matching GitHub's three-dot "Files changed". Best-effort:
// offline / a fork base not on `origin` falls back to the bare branch name. --quiet keeps
// rev-parse from printing on the miss path.
async function resolveRemoteBase(
	baseRefName: string,
	root: string,
	git: GitPort,
): Promise<string> {
	await git.run(['fetch', 'origin', baseRefName], root).catch(() => undefined)
	const remoteBase = `origin/${baseRefName}`
	try {
		await git.run(['rev-parse', '--verify', '--quiet', remoteBase], root)
		return remoteBase
	} catch {
		return baseRefName
	}
}

function readPrInfo(parsed: unknown): PrInfo | null {
	if (typeof parsed !== 'object' || parsed === null) return null
	if (!('headRefName' in parsed) || typeof parsed.headRefName !== 'string')
		return null
	if (!('baseRefName' in parsed) || typeof parsed.baseRefName !== 'string')
		return null
	return { headRefName: parsed.headRefName, baseRefName: parsed.baseRefName }
}

async function checkoutBranch(
	target: string,
	root: string,
	base: string | undefined,
	git: GitPort,
): Promise<PrTargetOutcome> {
	try {
		await git.run(['checkout', target], root)
		return { ok: true, target: { target, base } }
	} catch (error) {
		return {
			ok: false,
			reason: `Could not check out "${target}": ${errorMessage(error)}`,
		}
	}
}
