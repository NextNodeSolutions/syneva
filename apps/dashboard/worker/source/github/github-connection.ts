import * as z from 'zod/mini'

import { parallelMap } from './parallel-map'

import type { GithubConnection } from '@syneva/contracts/github'
import type { GithubClient } from './github-client'

const installationSchema = z.object({
	id: z.int(),
	app_slug: z.string(),
	account: z.object({ login: z.string() }),
	html_url: z.url(),
	suspended_at: z.nullable(z.string()),
	permissions: z.record(z.string(), z.string()),
})
const installationsPage = z.pipe(
	z.object({ installations: z.array(installationSchema) }),
	z.transform(page => page.installations),
)
const repositoriesPage = z.pipe(
	z.object({
		repositories: z.array(
			z.object({
				id: z.int(),
				name: z.string(),
				private: z.boolean(),
				owner: z.object({ login: z.string() }),
			}),
		),
	}),
	z.transform(page => page.repositories),
)

export async function readGithubConnection(
	client: GithubClient,
	appSlug: string,
	enabled: ReadonlySet<number>,
): Promise<GithubConnection> {
	const installations = (
		await client.pages('/user/installations', installationsPage)
	).filter(
		installation =>
			installation.app_slug === appSlug && !installation.suspended_at,
	)
	const repositoryGroups = await parallelMap(
		installations,
		async installation => {
			const repositories = await client.pages(
				`/user/installations/${installation.id}/repositories`,
				repositoriesPage,
			)
			return repositories.map(repository => ({
				id: repository.id,
				owner: repository.owner.login,
				repo: repository.name,
				isPrivate: repository.private,
				isEnabled: enabled.has(repository.id),
				installationId: installation.id,
			}))
		},
	)
	return {
		isLinked: true,
		installUrl: installUrl(appSlug),
		installations: installations.map(installation => ({
			id: installation.id,
			account: installation.account.login,
			configurationUrl: installation.html_url,
			hasRequiredPermissions: hasRequiredPermissions(
				installation.permissions,
			),
		})),
		repositories: repositoryGroups
			.flat()
			.toSorted((left, right) =>
				`${left.owner}/${left.repo}`.localeCompare(
					`${right.owner}/${right.repo}`,
				),
			),
	}
}

export function installUrl(appSlug: string): string {
	return `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new`
}

const ACCESS_RANK = { read: 1, write: 2 } as const
const REQUIRED_ACCESS: Readonly<Record<string, keyof typeof ACCESS_RANK>> = {
	contents: 'read',
	pull_requests: 'write',
	actions: 'write',
}

function hasRequiredPermissions(
	permissions: Readonly<Record<string, string>>,
): boolean {
	return Object.entries(REQUIRED_ACCESS).every(
		([permission, access]) =>
			grantedRank(permissions[permission]) >= ACCESS_RANK[access],
	)
}

function grantedRank(access: string | undefined): number {
	return access === 'read' || access === 'write' ? ACCESS_RANK[access] : 0
}
