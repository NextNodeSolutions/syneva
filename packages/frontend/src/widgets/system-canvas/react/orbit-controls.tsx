import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'

import { TurnGlyph, ZoomGlyph } from './glyphs'
import { projection } from './projection.styles'

import type { ReactElement } from 'react'
import type { OrbitHold } from './use-orbit'

const ICON = [deskControl.mini, deskControl.iconMini]

// The 3D view's controls in its corner: what a drag does, then the same moves as buttons for a keyboard.
export function OrbitControls({ hold }: { hold: OrbitHold }): ReactElement {
	return (
		<div
			role="group"
			aria-label="Camera"
			{...stylex.props(projection.controls)}
		>
			<span {...stylex.props(projection.hint)}>Drag to turn</span>
			<Button
				size="small"
				css={ICON}
				aria-label="Turn left"
				onClick={() => hold.turnBy(-1)}
			>
				<TurnGlyph isLeft />
			</Button>
			<Button
				size="small"
				css={ICON}
				aria-label="Turn right"
				onClick={() => hold.turnBy(1)}
			>
				<TurnGlyph isLeft={false} />
			</Button>
			<Button
				size="small"
				css={ICON}
				aria-label="Zoom out"
				onClick={() => hold.zoomBy(-1)}
			>
				<ZoomGlyph isIn={false} />
			</Button>
			<Button
				size="small"
				css={ICON}
				aria-label="Zoom in"
				onClick={() => hold.zoomBy(1)}
			>
				<ZoomGlyph isIn />
			</Button>
			<Button size="small" css={deskControl.mini} onClick={hold.reset}>
				Reset
			</Button>
		</div>
	)
}
