import { AppLink } from '@shared/router/AppLink'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { PageHead } from '@shared/ui/PageHead'
import * as stylex from '@stylexjs/stylex'
import { textLink } from '@syneva/design-system/inline.styles'

import type { ReactElement } from 'react'

export function NotFoundPage(): ReactElement {
	return (
		<>
			<DocumentTitle title="Not found" />
			<PageHead
				eyebrow="Not found"
				title="No page lives at this address."
			/>
			<PageBody>
				<AppLink
					to={PAGE_ROUTES.dashboard}
					{...stylex.props(textLink.base, textLink.small)}
				>
					Back to the dashboard
				</AppLink>
			</PageBody>
		</>
	)
}
