import { Column, Img, Link, Row, Section } from '@react-email/components'

import { email } from './email.styles'

import type { ReactElement } from 'react'

// The lockup as a PNG (public/email/syneva.png, the site's mark and wordmark drawn at 3x): Gmail and Outlook show no SVG.
const LOCKUP = { path: '/email/syneva.png', width: 120, height: 32 }

export function EmailHeader({
	origin,
	caption,
}: {
	origin: string
	caption: string
}): ReactElement {
	return (
		<Section style={email.header}>
			<Row>
				<Column>
					<Link href={origin}>
						<Img
							src={`${origin}${LOCKUP.path}`}
							width={LOCKUP.width}
							height={LOCKUP.height}
							alt="syneva"
							style={email.logo}
						/>
					</Link>
				</Column>
				<Column style={email.headerCaption}>{caption}</Column>
			</Row>
		</Section>
	)
}
