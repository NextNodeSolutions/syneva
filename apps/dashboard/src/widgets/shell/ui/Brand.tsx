import { PRODUCT_NAME } from '@shared/config/product-name'
import { AppLink } from '@shared/router/AppLink'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import * as stylex from '@stylexjs/stylex'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
} from '@syneva/design-system/brand'
import { brand } from '@syneva/design-system/brand.styles'
import { brandMarker } from '@syneva/design-system/brand.stylex'

import { sidebarBrand } from './brand.styles'

import type { ReactElement, ReactNode } from 'react'

export function Brand({ children }: { children?: ReactNode }): ReactElement {
	return (
		<AppLink
			to={PAGE_ROUTES.dashboard}
			aria-label={`${PRODUCT_NAME} dashboard`}
			{...stylex.props(brand.link, brandMarker, sidebarBrand.link)}
		>
			<svg
				{...stylex.props(brand.mark, sidebarBrand.mark)}
				viewBox={MARK_VIEW_BOX}
				aria-hidden="true"
			>
				<path d={MARK_RAYS} />
				<path d={MARK_DIAMOND} />
			</svg>
			{children}
		</AppLink>
	)
}
