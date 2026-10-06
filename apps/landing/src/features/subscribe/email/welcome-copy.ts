import { REPO_URL } from '@entities/site/model/project'
import { PAGES } from '@entities/site/model/site-map'

// The welcome's words, once: the HTML template and the plain-text body both read them.
export const WELCOME_COPY = {
	preview: 'Soon, you decide what ships. Here’s what will be waiting.',
	caption: 'Launch list',
	added: 'You’re on the launch list.',
	// The site's slogan, turned toward launch day; `decided` is the word set in green.
	verdict: { before: 'Soon, you', decided: 'decide', after: 'what ships.' },
	body: 'Thanks for joining. Syneva isn’t ready to install yet. The day it is, you’ll get one more email, and nothing in between. Until then, here’s what will be waiting for you.',
	round: 'One review round',
	illustrative: 'Illustrative · not a screenshot',
	asker: 'You · ask',
	answerer: 'Your agent',
	coming: 'What’s waiting',
	follow: 'Follow along',
} as const

type FollowLink = { label: string; href: string }

export const followLinks = (origin: string): readonly FollowLink[] => [
	{ label: 'What ships each week', href: `${origin}${PAGES.changelog.href}` },
	{ label: 'The code on GitHub', href: REPO_URL },
]

// Why this arrived and how to stop it; `site` is the host that took the signup.
export const footerReason = (recipient: string, site: string): string =>
	`You’re getting this because ${recipient} joined the launch list on ${site}. If that wasn’t you, or you change your mind, reply and I’ll take you off the list.`
