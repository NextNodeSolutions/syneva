import { fullName } from '@syneva/contracts/projects'

import { SourceError } from '../source-error'

import { listGithubReviews, readGithubReview } from './github-review'
import { parallelMap } from './parallel-map'

import type { GithubRepository } from '@syneva/contracts/github'
import type { ReviewSource } from '../review-source'
import type { GithubClient } from './github-client'

export function createGithubSource(
	client: GithubClient,
	repositories: readonly GithubRepository[],
): ReviewSource {
	const enabled = repositories.filter(repository => repository.isEnabled)
	return {
		listProjects: () =>
			parallelMap(enabled, async project => ({
				project: { owner: project.owner, repo: project.repo },
				reviews: await listGithubReviews(
					client,
					project.owner,
					project.repo,
				),
			})),
		readReview: async ref => {
			const canRead = enabled.some(
				repository =>
					fullName(repository).toLowerCase() ===
					fullName(ref).toLowerCase(),
			)
			if (!canRead)
				throw new SourceError(
					'not_found',
					'Enable this repository in Settings before opening its pull requests.',
				)
			return readGithubReview(client, ref)
		},
	}
}
