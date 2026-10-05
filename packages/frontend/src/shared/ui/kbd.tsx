import * as stylex from '@stylexjs/stylex'

import { kbd } from './kbd.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// A key hint chip (see kbd.styles.ts). `css` carries the context: onFill on a
// solid action, onTint on a tinted one.
export function Kbd({
	keys,
	css,
}: {
	keys: string
	css?: Style
}): ReactElement {
	return <kbd {...stylex.props(kbd.base, css)}>{keys}</kbd>
}
