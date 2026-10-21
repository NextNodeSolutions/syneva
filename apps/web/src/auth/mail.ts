// The magic link's one way out: Resend from hello@syneva.dev, as the landing sends its list's
// emails (apps/landing's resend.server.ts, copied, not imported: the apps never import each
// other), or, with MAIL_TRANSPORT=log, one line on the Worker's stdout (local development only:
// the smoke reads the link there). Resend's error code is propagated, never its message, which can
// quote the recipient.
const RESEND_EMAILS_URL = 'https://api.resend.com/emails'
const FROM = 'Syneva <hello@syneva.dev>'
const UNKNOWN_ERROR = 'unknown_error'

export type SignInEmail = { to: string; link: string; minutes: number }

export class MailError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'MailError'
	}
}

export async function sendSignInEmail(
	env: Env,
	email: SignInEmail,
): Promise<void> {
	if (env.MAIL_TRANSPORT === 'log') {
		console.log(JSON.stringify({ event: 'magic-link', link: email.link }))
		return
	}
	if (!env.RESEND_API_KEY) throw new MailError('RESEND_API_KEY is not set')
	const response = await fetch(RESEND_EMAILS_URL, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			from: FROM,
			to: [email.to],
			subject: 'Sign in to Syneva',
			html: htmlOf(email),
			text: textOf(email),
		}),
		signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
	})
	if (!response.ok)
		throw new MailError(
			`Resend refused the email (${response.status} ${await errorCodeOf(response)})`,
		)
}

const SEND_TIMEOUT_MS = 10_000

function textOf({ link, minutes }: SignInEmail): string {
	return `Sign in to Syneva:\n\n${link}\n\nThe link works once, for ${minutes} minutes. If you did not ask for it, ignore this email: nothing happens without it.\n`
}

function htmlOf({ link, minutes }: SignInEmail): string {
	const href = link.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
	return `<!doctype html><html lang="en"><body style="margin:0;padding:32px;background:#f6f6f0;color:#191b18;font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif">
<p style="margin:0 0 20px;font-size:22px;font-weight:600;letter-spacing:-.03em">syneva</p>
<p style="margin:0 0 24px">Sign in to Syneva with this link. It works once, for ${minutes} minutes.</p>
<p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;padding:12px 18px;background:#0e6582;color:#ffffff;text-decoration:none;font-weight:500">Sign in</a></p>
<p style="margin:0;color:#60635c;font-size:14px">If you did not ask for it, ignore this email: nothing happens without it.</p>
</body></html>`
}

async function errorCodeOf(response: Response): Promise<string> {
	const body: unknown = await response.json().catch(() => null)
	if (
		typeof body === 'object' &&
		body !== null &&
		'name' in body &&
		typeof body.name === 'string'
	)
		return body.name
	return UNKNOWN_ERROR
}
