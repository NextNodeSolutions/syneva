import { file } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

import { CHANGE_KINDS } from './views/resources/model/change-kinds'

export const faqTopic = z.object({
	position: z.number().int().positive(),
	title: z.string(),
	blurb: z.string(),
	items: z
		.array(z.object({ question: z.string(), answer: z.string() }))
		.nonempty(),
})

export const changelogWeek = z.object({
	label: z.string(),
	title: z.string(),
	changes: z
		.array(z.object({ kind: z.enum(CHANGE_KINDS), text: z.string() }))
		.nonempty(),
})

const faq = defineCollection({
	loader: file('src/content/faq.json'),
	schema: faqTopic,
})
const changelog = defineCollection({
	loader: file('src/content/changelog.json'),
	schema: changelogWeek,
})

export const collections = { faq, changelog }
