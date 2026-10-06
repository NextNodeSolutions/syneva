import { deskName } from '@entities/review/desk-name'
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
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'
import { isTreeless } from '../layout'

import { topBar } from './top-bar.styles'
import { brandMarker } from './top-bar.stylex'

import type { ReactElement } from 'react'

export function BrandBlock(): ReactElement {
	const { S } = chromeCtx()
	const name = S.state ? deskName(S.state) : ''
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
					isTreeless(S) && topBar.navToggleHidden,
					tip.host,
				)}
				data-tip="Files (⇧B)"
				aria-label="Toggle file tree"
				onClick={() => {
					S.treeDrawerOpen = !S.treeDrawerOpen
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
