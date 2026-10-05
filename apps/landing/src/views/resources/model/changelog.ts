import { getCollection } from 'astro:content'

import type { z } from 'astro/zod'
import type { changelogWeek } from '../../../content.config'

// One week of the changelog (src/content/changelog.json), with its first
// day as an ISO date (the entry's id).
export type Week = z.infer<typeof changelogWeek> & { firstDay: string }

// The changelog's weeks, newest first.
export async function recentWeeks(): Promise<Week[]> {
	const entries = await getCollection('changelog')
	return entries
		.map(({ id, data }) => Object.assign({ firstDay: id }, data))
		.toSorted((newer, older) =>
			older.firstDay.localeCompare(newer.firstDay),
		)
}
