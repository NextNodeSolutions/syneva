import * as stylex from '@stylexjs/stylex'

import { icon } from './icon.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// React primitive for the icon sprite (shared/ui/icons.ts injects the symbols
// once at boot; `<use href="#gly-…">` resolves document-wide). Every icon keeps
// the base size; callers size or tint it through `css`. `className` still
// carries the legacy modifier classes of the chrome not yet on StyleX.
export function Icon({
	id,
	css,
	className,
	title,
}: {
	id: string
	css?: Style
	className?: string
	title?: string | undefined
}): ReactElement {
	const styled = stylex.props(icon.base, css)
	const cls = [styled.className, className].filter(Boolean).join(' ')
	return (
		<svg className={cls} aria-hidden={!title}>
			{/* The SVG-native tooltip: React's SVGProps has no title attribute. */}
			{title ? <title>{title}</title> : null}
			<use href={`#${id}`} />
		</svg>
	)
}
