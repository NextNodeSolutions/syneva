import {
	Body,
	Container,
	Html,
	Preview,
	Section,
} from '@react-email/components'

import { email } from './email.styles'
import { EmailFooter } from './EmailFooter'
import { EmailHead } from './EmailHead'
import { EmailHeader } from './EmailHeader'

import type { ReactElement, ReactNode } from 'react'
import type { ListEmailProps } from '../model/list-email'

type EmailFrameProps = ListEmailProps & {
	// The line an inbox shows beside the subject.
	preview: string
	caption: string
	children: ReactNode
}

// Every list email's frame: the site's faces, the inbox preview, the paper field, the lockup over the white ruled card that holds the email's own content, then the footer.
export function EmailFrame({
	recipient,
	origin,
	preview,
	caption,
	children,
}: EmailFrameProps): ReactElement {
	return (
		<Html lang="en">
			<EmailHead origin={origin} />
			<Preview>{preview}</Preview>
			<Body style={email.body}>
				<Container style={email.container}>
					<EmailHeader origin={origin} caption={caption} />
					<Section style={email.card}>{children}</Section>
					<EmailFooter recipient={recipient} origin={origin} />
				</Container>
			</Body>
		</Html>
	)
}
