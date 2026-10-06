import { SITE_NAME } from '@entities/site/model/site-map'

import { renderWelcome } from '../email/render-welcome.server'

import { LIST_ADDRESS } from './list'
import { sendEmail } from './resend.server'

const WELCOME_SUBJECT = `You\u2019re on the ${SITE_NAME} launch list`

// `origin` is the deploy's canonical site (SITE_URL: syneva.dev, dev.syneva.dev): the email's links and images point back at it for as long as it sits in an inbox.
export async function sendWelcome(
	apiKey: string,
	to: string,
	origin: string,
): Promise<void> {
	const { html, text } = renderWelcome({ recipient: to, origin })
	await sendEmail(apiKey, {
		from: `${SITE_NAME} <${LIST_ADDRESS}>`,
		to,
		replyTo: LIST_ADDRESS,
		subject: WELCOME_SUBJECT,
		html,
		text,
	})
}
