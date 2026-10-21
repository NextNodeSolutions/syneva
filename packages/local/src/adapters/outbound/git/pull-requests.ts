// The local PullRequestPort: GitHub's pull requests through the gh CLI, their heads through git.
import { errorMessage } from '@syneva/core/application/errors'
import { prNumber, prRepository } from '@syneva/core/application/pr-target'

import { gh, git } from './exec.js'

import type {
	PullRequest,
	PullRequestPort,
} from '@syneva/core/application/ports'

// The PR as gh resolved it: `url` names the repository the head is fetched from.
type PrInfo = {
	headRefName: string
	baseRefName: string
	url: string | undefined
}

// A GitHub remote's `owner/name`, in its https or ssh form.
const GITHUB_REMOTE = /github\.com[:/](?<repo>[^/]+\/[^/]+?)(?:\.git)?\/?$/

export const ghPullRequests: PullRequestPort = Object.freeze({
	resolve,
	checkout,
})

async function resolve(root: string, ref: string): Promise<PullRequest> {
	const prInfo = await fetchPrInfo(ref, root)
	const head = await fetchPrHead(prInfo.url ?? ref, root)
	return {
		headBranch: prInfo.headRefName,
		baseBranch: prInfo.baseRefName,
		head,
	}
}

async function checkout(root: string, ref: string): Promise<void> {
	await gh(['pr', 'checkout', ref], root)
}

async function fetchPrInfo(ref: string, root: string): Promise<PrInfo> {
	let raw: string
	try {
		raw = await gh(
			['pr', 'view', ref, '--json', 'headRefName,baseRefName,url'],
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

function readPrInfo(parsed: unknown): PrInfo | null {
	if (typeof parsed !== 'object' || parsed === null) return null
	if (!('headRefName' in parsed) || typeof parsed.headRefName !== 'string')
		return null
	if (!('baseRefName' in parsed) || typeof parsed.baseRefName !== 'string')
		return null
	return {
		headRefName: parsed.headRefName,
		baseRefName: parsed.baseRefName,
		url:
			'url' in parsed && typeof parsed.url === 'string'
				? parsed.url
				: undefined,
	}
}

// The PR's head commits, fetched but not checked out: GitHub serves every PR's head at refs/pull/<n>/head, and the fetched commit is pinned by its sha so no later fetch can move the diff under the validation.
async function fetchPrHead(ref: string, root: string): Promise<string> {
	const repo = prRepository(ref)
	const remote = repo
		? ((await remoteOf(repo, root)) ?? `https://github.com/${repo}.git`)
		: 'origin'
	await git(['fetch', remote, `refs/pull/${prNumber(ref)}/head`], root)
	return await git(['rev-parse', 'FETCH_HEAD'], root)
}

// The PR's repository (gh's answer, the URL's own) and not blindly origin: in a fork's clone origin is the fork, whose PR of the same number is another PR. Its remote when the clone has one, so that remote's credentials are used.
async function remoteOf(
	repo: string,
	root: string,
): Promise<string | undefined> {
	const remotes = await git(['remote', '-v'], root).catch(() => '')
	const wanted = repo.toLowerCase()
	for (const line of remotes.split('\n')) {
		const [name, url] = line.split(/\s+/)
		if (!name || !url) continue
		const named = GITHUB_REMOTE.exec(url)?.groups?.repo
		if (named?.toLowerCase() === wanted) return name
	}
	return undefined
}
