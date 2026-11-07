import { SITE_NAME } from '@entities/site/model/site-map'

import { renderEmail } from '../email/render-email.server'

import { LIST_ADDRESS } from './list'
import { sendEmail } from './resend.server'

import type { ListEmail } from './list-email'

const SUBJECTS: Record<ListEmail, string> = {
	welcome: `You\u2019re on the ${SITE_NAME} launch list`,
	'already-listed': `You\u2019re already on the ${SITE_NAME} launch list`,
}

// `origin` is the deploy's canonical site (SITE_URL: syneva.dev, dev.syneva.dev): the email's links and images point back at it for as long as it sits in an inbox.
export type ListSender = { apiKey: string; origin: string }

export async function sendListEmail(
	{ apiKey, origin }: ListSender,
	to: string,
	kind: ListEmail,
): Promise<void> {
	const { html, text } = renderEmail(kind, { recipient: to, origin })
	await sendEmail(apiKey, {
		from: `${SITE_NAME} <${LIST_ADDRESS}>`,
		to,
		replyTo: LIST_ADDRESS,
		subject: SUBJECTS[kind],
		html,
		text,
	})
}
