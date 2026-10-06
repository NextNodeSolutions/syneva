import { getCollection } from 'astro:content'

import type { z } from 'astro/zod'
import type { changelogWeek } from '../../../content.config'

export type Week = z.infer<typeof changelogWeek> & { firstDay: string }

export async function recentWeeks(): Promise<Week[]> {
	const entries = await getCollection('changelog')
	return entries
		.map(({ id, data }) => Object.assign({ firstDay: id }, data))
		.toSorted((newer, older) =>
			older.firstDay.localeCompare(newer.firstDay),
		)
}
