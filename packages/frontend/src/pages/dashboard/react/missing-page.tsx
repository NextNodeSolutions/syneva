import { AppLink } from '@shared/ui/app-link'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'
import { focus } from '@syneva/design-system/controls.styles'
import { textLink } from '@syneva/design-system/inline.styles'

import { PageHead } from './page-head'

import type { ReactElement } from 'react'

// A dashboard address that names no page (a link from an older Syneva, a typo).
export function MissingPage(): ReactElement {
	return (
		<PageHead
			title="Nothing here."
			lede={
				<>
					This address names no page of the hub.{' '}
					<AppLink
						href={DASHBOARD_PATHS.overview}
						css={[focus.ring, textLink.base]}
					>
						Back to the overview
					</AppLink>
				</>
			}
		/>
	)
}
