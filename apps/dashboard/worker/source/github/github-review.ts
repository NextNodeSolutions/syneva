import * as z from 'zod/mini'

import { SourceError } from '../source-error'

import { parallelMap } from './parallel-map'

import type {
	ReviewCode,
	ReviewRef,
	ReviewSummary,
} from '@syneva/contracts/projects'
import type { GithubClient } from './github-client'

const pullSchema = z.object({
	number: z.int(),
	title: z.string(),
	user: z.nullable(z.object({ login: z.string() })),
	base: z.object({ ref: z.string(), sha: z.string() }),
	head: z.object({ ref: z.string(), sha: z.string() }),
	draft: z.boolean(),
	updated_at: z.string(),
	changed_files: z.int(),
	additions: z.int(),
	deletions: z.int(),
})
const fileSchema = z.object({
	filename: z.string(),
	previous_filename: z.optional(z.string()),
	status: z.string(),
	additions: z.int(),
	deletions: z.int(),
	patch: z.optional(z.string()),
})
const pullListSchema = z.array(z.object({ number: z.int() }))

type Pull = z.infer<typeof pullSchema>
type ChangedFile = z.infer<typeof fileSchema>

export async function listGithubReviews(
	client: GithubClient,
	owner: string,
	repo: string,
): Promise<ReviewSummary[]> {
	const root = repositoryPath(owner, repo)
	const pulls = await client.pages(
		`${root}/pulls?state=open&sort=updated&direction=desc`,
		pullListSchema,
	)
	return parallelMap(pulls, async pull =>
		summary(await client.json(`${root}/pulls/${pull.number}`, pullSchema)),
	)
}

export async function readGithubReview(
	client: GithubClient,
	ref: ReviewRef,
): Promise<ReviewCode> {
	const root = `${repositoryPath(ref.owner, ref.repo)}/pulls/${ref.number}`
	const pull = await client.json(root, pullSchema)
	const files = await client.pages(`${root}/files`, z.array(fileSchema))
	const latest = await client.json(root, pullSchema)
	if (pull.base.sha !== latest.base.sha || pull.head.sha !== latest.head.sha)
		throw new SourceError(
			'review_changed',
			'This pull request changed while loading. Refresh to read the new version.',
		)
	if (files.length !== pull.changed_files)
		throw new SourceError(
			'diff_unavailable',
			'GitHub could not provide every changed file. Open this pull request on GitHub.',
		)
	return {
		project: { owner: ref.owner, repo: ref.repo },
		review: summary(pull),
		diff: files.map(filePatch).join('\n'),
		unavailableFiles: files
			.filter(file => !file.patch)
			.map(file => file.filename),
	}
}

function summary(pull: Pull): ReviewSummary {
	return {
		number: pull.number,
		title: pull.title,
		author: pull.user?.login ?? 'deleted-user',
		base: pull.base.ref,
		head: pull.head.ref,
		isDraft: pull.draft,
		updatedAt: pull.updated_at,
		churn: {
			files: pull.changed_files,
			additions: pull.additions,
			deletions: pull.deletions,
		},
	}
}

function repositoryPath(owner: string, repo: string): string {
	return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

function filePatch(file: ChangedFile): string {
	const before = JSON.stringify(
		`a/${file.previous_filename ?? file.filename}`,
	)
	const after = JSON.stringify(`b/${file.filename}`)
	const headers = [`diff --git ${before} ${after}`]
	if (file.status === 'added') headers.push('new file mode 100644')
	if (file.status === 'removed') headers.push('deleted file mode 100644')
	if (file.previous_filename)
		headers.push(
			`rename from ${JSON.stringify(file.previous_filename)}`,
			`rename to ${JSON.stringify(file.filename)}`,
		)
	if (!file.patch)
		return `${headers.join('\n')}\nBinary files ${before} and ${after} differ\n`
	const oldPath = file.status === 'added' ? '/dev/null' : before
	const newPath = file.status === 'removed' ? '/dev/null' : after
	return `${headers.join('\n')}\n--- ${oldPath}\n+++ ${newPath}\n${file.patch}\n`
}
