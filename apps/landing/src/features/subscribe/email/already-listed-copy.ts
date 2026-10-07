import { WELCOME_COPY } from './welcome-copy'

// The words an address already on the list gets when it signs up again, once: the HTML template and the plain-text body both read them. The caption and the slogan stay the welcome's.
export const ALREADY_LISTED_COPY = {
	preview: 'This address was already on the launch list, so nothing changes.',
	caption: WELCOME_COPY.caption,
	added: 'You’re already on the launch list.',
	verdict: WELCOME_COPY.verdict,
	body: 'You signed up again, but this address was already on the launch list, so there’s nothing more to do. The day Syneva installs, you’ll get one more email. A second signup doesn’t change the first, so if you meant to update your name or your agents, reply and I’ll do it.',
} as const
