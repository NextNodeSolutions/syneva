import * as z from 'zod/mini'

import { projectRefSchema } from './projects'
const MAX_PROJECT_SELECTION = 1000

export const githubRepositorySchema = z.extend(projectRefSchema, {
	id: z.int().check(z.positive()),
	isPrivate: z.boolean(),
	isEnabled: z.boolean(),
	installationId: z.int().check(z.positive()),
})
export type GithubRepository = z.infer<typeof githubRepositorySchema>

export const githubInstallationSchema = z.object({
	id: z.int().check(z.positive()),
	account: z.string(),
	configurationUrl: z.url(),
	hasRequiredPermissions: z.boolean(),
})
export const githubConnectionSchema = z.object({
	isLinked: z.boolean(),
	installUrl: z.url(),
	installations: z.array(githubInstallationSchema),
	repositories: z.array(githubRepositorySchema),
})
export type GithubConnection = z.infer<typeof githubConnectionSchema>
export const projectSelectionSchema = z.object({
	repositoryIds: z
		.array(z.int().check(z.positive()))
		.check(z.maxLength(MAX_PROJECT_SELECTION)),
})
