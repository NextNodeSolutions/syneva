// Resend's email API, reached with one request: the one place the site
// speaks Resend, so a provider change stays in this file.
const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

export type Email = {
	from: string
	to: string
	replyTo: string
	subject: string
	text: string
}

export async function sendEmail(apiKey: string, email: Email): Promise<void> {
	const response = await fetch(RESEND_EMAILS_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: email.from,
			to: [email.to],
			reply_to: email.replyTo,
			subject: email.subject,
			text: email.text,
		}),
	})
	if (!response.ok)
		throw new Error(
			`Resend refused the email (${response.status}): ${await response.text()}`,
		)
}
