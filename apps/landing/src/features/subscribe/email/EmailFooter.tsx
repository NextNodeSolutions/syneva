import { TAGLINE } from '@entities/site/model/project'
import { Link, Section, Text } from '@react-email/components'

import { email } from './email.styles'
import { followLinks, footerReason, WELCOME_COPY } from './welcome-copy'

import type { ReactElement } from 'react'

// Where to follow along, why this arrived and how to stop it, then the site's sign-off.
export function EmailFooter({
	recipient,
	origin,
}: {
	recipient: string
	origin: string
}): ReactElement {
	const links = followLinks(origin)
	return (
		<Section style={email.footer}>
			<Text style={email.footerText}>
				{WELCOME_COPY.follow}:{' '}
				{links.map((link, index) => (
					<span key={link.href}>
						{index > 0 && ' · '}
						<Link href={link.href} style={email.footerLink}>
							{link.label}
						</Link>
					</span>
				))}
			</Text>
			<Text style={email.footerText}>
				{footerReason(recipient, new URL(origin).host)}
			</Text>
			<Text style={email.footerText}>{TAGLINE}</Text>
		</Section>
	)
}
