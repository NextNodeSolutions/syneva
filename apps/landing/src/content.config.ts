import { file } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

import { CHANGE_KINDS } from './views/resources/model/change-kinds'

// The FAQ page's topics: each has a title, a blurb and its questions, whose
// answers are HTML. `position` orders the topics on the page.
const faq = defineCollection({
	loader: file('src/content/faq.json'),
	schema: z.object({
		position: z.number().int().positive(),
		title: z.string(),
		blurb: z.string(),
		items: z
			.array(z.object({ question: z.string(), answer: z.string() }))
			.nonempty(),
	}),
})

// The changelog: one entry per week of product changes, keyed by its first
// day as an ISO date. Refactors and chores stay in git log.
const changelog = defineCollection({
	loader: file('src/content/changelog.json'),
	schema: z.object({
		label: z.string(),
		title: z.string(),
		changes: z
			.array(z.object({ kind: z.enum(CHANGE_KINDS), text: z.string() }))
			.nonempty(),
	}),
})

export const collections = { faq, changelog }
