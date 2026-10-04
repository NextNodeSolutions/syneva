import { getCollection } from 'astro:content'

import type { CollectionEntry } from 'astro:content'

// One FAQ topic, as src/content/faq.json holds it.
export type QaGroup = CollectionEntry<'faq'>['data']

// The FAQ's topics in page order: the topic index and the blocks both read it.
export async function faqGroups(): Promise<QaGroup[]> {
	const entries = await getCollection('faq')
	return entries
		.map(({ data }) => data)
		.toSorted((first, second) => first.position - second.position)
}

// The id of a topic's block, which the topic index links to.
export const qaAnchor = ({ position }: QaGroup): string => `qa-${position}`
