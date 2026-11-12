import { SourceError } from '../source/source-error'

import type { GithubConnection } from '@syneva/contracts/github'
import type { ProjectSelection } from '../source/project-selection'

export async function selectProjects(
	connection: GithubConnection,
	selection: ProjectSelection,
	repositoryIds: readonly number[],
): Promise<void> {
	const accessible = new Set(
		connection.repositories.map(repository => repository.id),
	)
	if (repositoryIds.some(id => !accessible.has(id)))
		throw new SourceError(
			'forbidden',
			'Select repositories available to your GitHub account and Syneva installation.',
		)
	await selection.replace(repositoryIds)
}
