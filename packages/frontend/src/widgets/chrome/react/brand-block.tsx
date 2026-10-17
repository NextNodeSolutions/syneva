import { deskName } from '@entities/review/desk-name'
import { useMediaQuery } from '@shared/lib/use-media-query'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
} from '@syneva/design-system/brand'
import { control } from '@syneva/design-system/controls.styles'
import { queries } from '@syneva/design-system/media.stylex'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'
import { isTreeless } from '../layout'

import { topBar } from './top-bar.styles'
import { brandMarker } from './top-bar.stylex'

import type { ReactElement } from 'react'

export function BrandBlock(): ReactElement {
	const { S } = chromeCtx()
	const name = S.state ? deskName(S.state) : ''
	// Under the tablet width the tree is a drawer this button slides out; wider, it is the column this button brings back once folded (the key's ⇧B).
	const isDrawer = useMediaQuery(queries.tablet)
	return (
		<div {...stylex.props(topBar.brand)}>
			<button
				{...stylex.props(
					press.control,
					control.base,
					deskControl.compact,
					control.quiet,
					deskControl.iconCompact,
					topBar.navToggle,
					S.treeFolded && topBar.navToggleFolded,
					isTreeless(S) && topBar.navToggleHidden,
					tip.host,
				)}
				data-tip="Files (⇧B)"
				aria-label="Toggle file tree"
				onClick={() => {
					if (isDrawer) S.treeDrawerOpen = !S.treeDrawerOpen
					else S.toggleTree?.()
				}}
			>
				<Icon id="gly-menu" />
			</button>
			<a
				{...stylex.props(topBar.home, brandMarker)}
				href="/"
				aria-label="Syneva hub"
			>
				<svg
					{...stylex.props(topBar.mark)}
					viewBox={MARK_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={MARK_RAYS} />
					<path d={MARK_DIAMOND} />
				</svg>
				syneva
			</a>
			{name && (
				<span {...stylex.props(topBar.desk)} title={name}>
					{name}
				</span>
			)}
		</div>
	)
}
