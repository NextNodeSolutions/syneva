import { TAGLINE } from '@entities/site/model/project'

import { followLinks, footerReason, WELCOME_COPY } from './welcome-copy'

import type { ListEmailProps } from '../model/list-email'

// The plain-text counterpart of EmailFrame: the email's own lines, then the footer.
export function frameText(
	{ recipient, origin }: ListEmailProps,
	lines: readonly string[],
): string {
	const links = followLinks(origin).map(link => `${link.label}: ${link.href}`)
	return [
		...lines,
		'',
		'--',
		`${WELCOME_COPY.follow}:`,
		...links,
		'',
		footerReason(recipient, new URL(origin).host),
		TAGLINE,
		'',
	].join('\n')
}
