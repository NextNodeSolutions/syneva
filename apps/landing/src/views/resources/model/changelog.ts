import { getCollection } from 'astro:content'

import type { CollectionEntry } from 'astro:content'

// One week of the changelog (src/content/changelog.json); its id is the
// week's first day as an ISO date.
export type Week = CollectionEntry<'changelog'>

// The changelog's weeks, newest first.
export async function recentWeeks(): Promise<Week[]> {
	const weeks = await getCollection('changelog')
	return weeks.toSorted((newer, older) => older.id.localeCompare(newer.id))
}
