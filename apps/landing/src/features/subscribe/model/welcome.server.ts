import { SITE_NAME, SITE_URL } from '@entities/site/model/site-map'

import { sendEmail } from './resend.server'

// Sends, and replies come back to it (the domain is verified in Resend).
const LIST_ADDRESS = 'hello@syneva.dev'

const WELCOME_SUBJECT = `You\u2019re on the ${SITE_NAME} list`
const WELCOME_TEXT = `Hi,

Thanks for signing up. ${SITE_NAME} isn\u2019t ready to install yet: I\u2019ll write when it is, and now and then about what ships.

If this wasn\u2019t you, or you change your mind, reply to this email and I\u2019ll take you off the list.

${SITE_NAME}
${SITE_URL}
`

export function sendWelcome(apiKey: string, to: string): Promise<void> {
	return sendEmail(apiKey, {
		from: `${SITE_NAME} <${LIST_ADDRESS}>`,
		to,
		replyTo: LIST_ADDRESS,
		subject: WELCOME_SUBJECT,
		text: WELCOME_TEXT,
	})
}
