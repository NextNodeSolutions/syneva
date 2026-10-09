import { errorMessage } from './errors.js'

import type { ReviewMode } from '../domain/review.js'
import type { GitPort } from './ports.js'

// How the head is reached once the open is admitted: a PR number or URL through gh (it tracks a fork's head), a branch through git.
export type PrCheckout =
	| { kind: 'pr'; ref: string }
	| { kind: 'branch'; name: string }

// `head` is the commit the diff is built against before anything is checked out - the PR's own head, fetched, or the branch's tip - so a guide is validated on the review as it will be while HEAD is still where the agent left it.
export type PrTarget = {
	target: string | undefined
	base: string | undefined
	head?: string | undefined
	checkout?: PrCheckout | undefined
}

export type PrTargetOutcome =
	| { ok: true; target: PrTarget }
	| { ok: false; reason: string }

export type CheckoutOutcome = { ok: true } | { ok: false; reason: string }

type PrInfo = { headRefName: string; baseRefName: string }

const PR_NUMBER = /^\d+$/
const PR_URL = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(?<number>\d+)/

export function isPrRef(ref: string): boolean {
	return PR_NUMBER.test(ref) || PR_URL.test(ref)
}

function prNumber(ref: string): string {
	return PR_URL.exec(ref)?.groups?.number ?? ref
}

export type PrTargetQuery = {
	mode: ReviewMode
	target: string | undefined
	base: string | undefined
	root: string
}

// Resolves the head and the base without moving HEAD: the dirty-tree check, gh for a PR number, a fetch of the PR's head, a branch looked up locally then on origin.
// A failure is a reason, never a thrown error: the hub answers it as a 422 and the CLI prints it - the desk is simply not opened.
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
	return resolveBranch(target, root, base, git)
}

async function resolvePrNumber(
	ref: string,
	root: string,
	base: string | undefined,
	git: GitPort,
): Promise<PrTargetOutcome> {
	try {
		const prInfo = await fetchPrInfo(ref, root, git)
		const head = await fetchPrHead(ref, root, git)
		return {
			ok: true,
			target: {
				target: prInfo.headRefName,
				base:
					base ??
					(await resolveRemoteBase(prInfo.baseRefName, root, git)),
				head,
				checkout: { kind: 'pr', ref },
			},
		}
	} catch (error) {
		return { ok: false, reason: errorMessage(error) }
	}
}

// The PR's head commits, fetched but not checked out: GitHub serves every PR's head at refs/pull/<n>/head, and the fetched commit is pinned by its sha so no later fetch can move the diff under the validation.
async function fetchPrHead(
	ref: string,
	root: string,
	git: GitPort,
): Promise<string> {
	await git.run(['fetch', 'origin', `refs/pull/${prNumber(ref)}/head`], root)
	return await git.run(['rev-parse', 'FETCH_HEAD'], root)
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
// stale local base shows unrelated mainline commits; refresh the base ref and prefer the
// remote-tracking tip (GitHub's three-dot "Files changed"). Best-effort: offline or a fork base
// not on `origin` falls back to the bare branch name.
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

// A branch by its name, locally first, then as origin's (what `git checkout <name>` would track).
async function resolveBranch(
	name: string,
	root: string,
	base: string | undefined,
	git: GitPort,
): Promise<PrTargetOutcome> {
	const head =
		(await revision(name, root, git)) ??
		(await revision(`origin/${name}`, root, git))
	if (!head)
		return {
			ok: false,
			reason: `Could not find branch "${name}", locally or on origin.`,
		}
	return {
		ok: true,
		target: {
			target: name,
			base,
			head,
			checkout: { kind: 'branch', name },
		},
	}
}

async function revision(
	ref: string,
	root: string,
	git: GitPort,
): Promise<string | null> {
	return await git
		.run(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], root)
		.catch(() => null)
}

// The one PR operation with a side effect, run only once the open is admitted: HEAD moves to the reviewed head (gh tracks a fork's branch; a branch checks out by name).
export async function checkoutPrTarget(
	checkout: PrCheckout | undefined,
	root: string,
	git: GitPort,
): Promise<CheckoutOutcome> {
	if (!checkout) return { ok: true }
	try {
		if (checkout.kind === 'pr')
			await git.gh(['pr', 'checkout', checkout.ref], root)
		else await git.run(['checkout', checkout.name], root)
		return { ok: true }
	} catch (error) {
		const name = checkout.kind === 'pr' ? checkout.ref : checkout.name
		return {
			ok: false,
			reason: `Could not check out "${name}": ${errorMessage(error)}`,
		}
	}
}
