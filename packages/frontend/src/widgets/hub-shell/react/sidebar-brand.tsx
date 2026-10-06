import { AppLink } from '@shared/ui/app-link'
import * as stylex from '@stylexjs/stylex'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
	WORDMARK,
} from '@syneva/design-system/brand'
import { brand } from '@syneva/design-system/brand.styles'
import { brandMarker } from '@syneva/design-system/brand.stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { sidebar } from './hub-sidebar.styles'
import { sidebarParts } from './sidebar-parts.styles'

import type { ReactElement } from 'react'

// The wordmark at the sidebar's top, home to the overview. Folded, only the mark stays on the
// rail's centre line; the name and the product label clip away with the width.
export function SidebarBrand({
	isFolded,
}: {
	isFolded: boolean
}): ReactElement {
	return (
		<AppLink
			href={DASHBOARD_PATHS.overview}
			aria-label="Syneva hub, overview"
			css={[focus.ring, brand.link, sidebarParts.brand, brandMarker]}
		>
			<svg
				{...stylex.props(brand.mark, sidebarParts.mark)}
				viewBox={MARK_VIEW_BOX}
				aria-hidden="true"
			>
				<path d={MARK_RAYS} />
				<path d={MARK_DIAMOND} />
			</svg>
			<span
				{...stylex.props(
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				{WORDMARK}
			</span>
			<span
				{...stylex.props(
					sidebarParts.product,
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				hub
			</span>
		</AppLink>
	)
}
