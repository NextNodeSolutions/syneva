import { errorMessage } from './errors.js'

import type { ReviewMode } from '../domain/review.js'
import type { GitPort, PullRequestPort } from './ports.js'

// How the head is reached once the open is admitted: a PR number or URL through the hub's pull requests (they track a fork's head), a branch through git.
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

// What resolving and checking out a pr target reads: the repository, and the hub's pull requests where it has them (without, a PR ref is refused and a branch still opens).
export type PrTargetIo = {
	git: GitPort
	pulls?: PullRequestPort | undefined
}

const PR_NUMBER = /^\d+$/
const PR_URL =
	/^https?:\/\/github\.com\/(?<repo>[^/]+\/[^/]+)\/pull\/(?<number>\d+)/

export function isPrRef(ref: string): boolean {
	return PR_NUMBER.test(ref) || PR_URL.test(ref)
}

// A PR ref's number: the URL's, or the ref itself when it is one.
export function prNumber(ref: string): string {
	return PR_URL.exec(ref)?.groups?.number ?? ref
}

// The `owner/name` a PR URL names; undefined for a bare number (the clone's own repository).
export function prRepository(ref: string): string | undefined {
	return PR_URL.exec(ref)?.groups?.repo
}

export type PrTargetQuery = {
	mode: ReviewMode
	target: string | undefined
	base: string | undefined
	root: string
}

// Resolves the head and the base without moving HEAD: the dirty-tree check, the hub's pull requests for a PR number, a branch looked up locally then on origin.
// A failure is a reason, never a thrown error: the hub answers it as a 422 and the CLI prints it - the desk is simply not opened.
export async function resolvePrTarget(
	query: PrTargetQuery,
	io: PrTargetIo,
): Promise<PrTargetOutcome> {
	const { mode, target, base, root } = query
	if (mode !== 'pr' || !target) return { ok: true, target: { target, base } }
	const dirty = await io.git.trackedChanges(root).catch(() => '')
	if (dirty.trim())
		return {
			ok: false,
			reason: `Working tree has uncommitted changes to tracked files. Commit or stash them before reviewing a PR (no checkout performed):\n${dirty}`,
		}
	if (isPrRef(target)) return resolvePrNumber(target, root, base, io)
	return resolveBranch(target, root, base, io.git)
}

async function resolvePrNumber(
	ref: string,
	root: string,
	base: string | undefined,
	{ git, pulls }: PrTargetIo,
): Promise<PrTargetOutcome> {
	if (!pulls)
		return {
			ok: false,
			reason: `Could not resolve PR "${ref}": this hub resolves no pull requests. Pass a branch name instead.`,
		}
	try {
		const pr = await pulls.resolve(root, ref)
		return {
			ok: true,
			target: {
				target: pr.headBranch,
				base:
					base ?? (await resolveRemoteBase(pr.baseBranch, root, git)),
				head: pr.head,
				checkout: { kind: 'pr', ref },
			},
		}
	} catch (error) {
		return { ok: false, reason: errorMessage(error) }
	}
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
	return (await git.remoteBranch(root, baseRefName)) ?? baseRefName
}

// A branch by its name, locally first, then as origin's (what `git checkout <name>` would track).
async function resolveBranch(
	name: string,
	root: string,
	base: string | undefined,
	git: GitPort,
): Promise<PrTargetOutcome> {
	const head =
		(await git.resolveRef(root, name)) ??
		(await git.resolveRef(root, `origin/${name}`))
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

// The one PR operation with a side effect, run only once the open is admitted: HEAD moves to the reviewed head (a pull request through the hub's pull requests, which track a fork's branch; a branch checks out by name).
export async function checkoutPrTarget(
	checkout: PrCheckout | undefined,
	root: string,
	{ git, pulls }: PrTargetIo,
): Promise<CheckoutOutcome> {
	if (!checkout) return { ok: true }
	const name = checkout.kind === 'pr' ? checkout.ref : checkout.name
	try {
		if (checkout.kind === 'branch') await git.checkout(root, checkout.name)
		else if (pulls) await pulls.checkout(root, checkout.ref)
		// A pr checkout comes only out of a resolution through the pull requests, so a hub without them never holds one.
		else
			return {
				ok: false,
				reason: `Could not check out "${name}": this hub resolves no pull requests.`,
			}
		return { ok: true }
	} catch (error) {
		return {
			ok: false,
			reason: `Could not check out "${name}": ${errorMessage(error)}`,
		}
	}
}
