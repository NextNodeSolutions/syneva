import type { ReactElement } from 'react'

// The canvas's control glyphs, 12px line drawings in the text colour.

export function ZoomGlyph({ isIn }: { isIn: boolean }): ReactElement {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<path d={isIn ? 'M2 6h8M6 2v8' : 'M2 6h8'} />
		</svg>
	)
}

// A quarter turn about the scene, to the left or the right.
export function TurnGlyph({ isLeft }: { isLeft: boolean }): ReactElement {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<path
				d={
					isLeft
						? 'M3 6.5a3.5 3.5 0 1 0 1-2.5M3 1.5V4h2.5'
						: 'M9 6.5a3.5 3.5 0 1 1-1-2.5M9 1.5V4H6.5'
				}
			/>
		</svg>
	)
}
