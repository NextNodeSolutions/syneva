import type {
	ProjectList,
	ProjectRef,
	ProjectReviews,
} from '@syneva/contracts/projects'

export function findProject(
	list: ProjectList,
	{ owner, repo }: ProjectRef,
): ProjectReviews | undefined {
	return list.projects.find(
		({ project }) => project.owner === owner && project.repo === repo,
	)
}
