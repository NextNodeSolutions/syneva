import { getCollection } from 'astro:content'

import type { z } from 'astro/zod'
import type { faqTopic } from '../../../content.config'

export type QaGroup = z.infer<typeof faqTopic>

export async function faqGroups(): Promise<QaGroup[]> {
	const entries = await getCollection('faq')
	return entries
		.map(({ data }) => data)
		.toSorted((first, second) => first.position - second.position)
}

export const qaAnchor = ({ position }: QaGroup): string => `qa-${position}`
