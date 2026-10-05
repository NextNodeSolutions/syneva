import * as stylex from '@stylexjs/stylex'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
	WORDMARK,
} from '@syneva/design-system/brand'
import { brand } from '@syneva/design-system/brand.styles'
import { brandMarker } from '@syneva/design-system/brand.stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { appBrand } from './brand.styles'

import type { ReactElement } from 'react'

type BrandProps = {
	href: string
	// The link's whole accessible name: the wordmark and the product label are
	// what it looks like, not what it does.
	label: string
	product?: string | undefined
	current?: boolean | undefined
}

// The wordmark as a link home, in the recipe the site shares: the Syneva mark
// (it turns on hover), the name and, in an app, the product it names ("hub").
export function Brand({
	href,
	label,
	product,
	current,
}: BrandProps): ReactElement {
	return (
		<a
			{...stylex.props(
				focus.ring,
				brand.link,
				appBrand.link,
				brandMarker,
			)}
			href={href}
			aria-label={label}
			aria-current={current === true ? 'page' : undefined}
		>
			<svg
				{...stylex.props(brand.mark, appBrand.mark)}
				viewBox={MARK_VIEW_BOX}
				aria-hidden="true"
			>
				<path d={MARK_RAYS} />
				<path d={MARK_DIAMOND} />
			</svg>
			{WORDMARK}
			{product && (
				<>
					<span {...stylex.props(appBrand.rule)} aria-hidden="true" />
					<span {...stylex.props(appBrand.product)}>{product}</span>
				</>
			)}
		</a>
	)
}
