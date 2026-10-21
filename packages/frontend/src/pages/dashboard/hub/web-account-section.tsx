import { WEB_PAGES } from '@entities/hub/api'
import { useWebMe } from '@entities/hub/use-web-me'
import { Button } from '@shared/ui/button'
import * as stylex from '@stylexjs/stylex'

import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import type { ReactElement } from 'react'

const NOTE =
	'The account this browser is signed in with. Signing out ends the session of this browser; your hubs stay paired.'

// Who is signed in on the web, and the way to end the session: a plain same-origin form, so the
// Worker clears its cookie and answers with the sign-in page.
export function WebAccountSection(): ReactElement {
	const view = useWebMe()
	return (
		<PageSection title="Account" note={NOTE}>
			<p {...stylex.props(pageSection.note)}>
				{view.phase === 'read' && `Signed in as ${view.me.email}`}
				{view.phase === 'loading' && 'Reading your account…'}
				{view.phase === 'failed' && 'Your account could not be read.'}
			</p>
			<form method="post" action={WEB_PAGES.signOut}>
				<Button type="submit" tone="outlined" size="small">
					Sign out
				</Button>
			</form>
		</PageSection>
	)
}
