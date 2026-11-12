import { useState } from 'react'

import { API_ROUTES, apiErrorSchema } from '@syneva/contracts/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GithubRepository } from '@syneva/contracts/github'
import type { UseMutationResult } from '@tanstack/react-query'

type RepositorySelection = {
	selected: ReadonlySet<number>
	toggle: (id: number) => void
	save: UseMutationResult<void, Error, void>
}

export function useRepositorySelection(
	repositories: readonly GithubRepository[],
): RepositorySelection {
	const [selected, setSelected] = useState(
		new Set(
			repositories
				.filter(repository => repository.isEnabled)
				.map(repository => repository.id),
		),
	)
	const queryClient = useQueryClient()
	const save = useMutation({
		mutationFn: () => saveSelection([...selected]),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['projects'] })
			await queryClient.invalidateQueries({
				queryKey: ['github-connection'],
			})
		},
	})
	const toggle = (id: number): void => {
		setSelected(previous => {
			const next = new Set(previous)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
		save.reset()
	}
	return { selected, toggle, save }
}

async function saveSelection(repositoryIds: number[]): Promise<void> {
	const response = await fetch(API_ROUTES.githubProjects, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ repositoryIds }),
	})
	if (response.ok) return
	const failure = apiErrorSchema.safeParse(await response.json())
	throw new Error(
		failure.success
			? failure.data.error
			: 'Could not save projects. Retry in a moment.',
	)
}
