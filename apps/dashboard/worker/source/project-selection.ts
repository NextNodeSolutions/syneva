export type ProjectSelection = {
	read: () => Promise<ReadonlySet<number>>
	replace: (repositoryIds: readonly number[]) => Promise<void>
}

export function createProjectSelection(
	db: D1Database,
	userId: string,
): ProjectSelection {
	return {
		read: async () => {
			const rows = await db
				.prepare(
					'SELECT repositoryId FROM linkedProject WHERE userId = ?',
				)
				.bind(userId)
				.all<{ repositoryId: number }>()
			return new Set(rows.results.map(row => row.repositoryId))
		},
		replace: async repositoryIds => {
			const clear = db
				.prepare('DELETE FROM linkedProject WHERE userId = ?')
				.bind(userId)
			const inserts = [...new Set(repositoryIds)].map(repositoryId =>
				db
					.prepare(
						'INSERT INTO linkedProject (userId, repositoryId) VALUES (?, ?)',
					)
					.bind(userId, repositoryId),
			)
			await db.batch([clear, ...inserts])
		},
	}
}
