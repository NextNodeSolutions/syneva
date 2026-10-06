import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { kbd } from '@syneva/design-system/inline.styles'

import type { StaticStyle } from '@shared/lib/cx'

export function kbdHtml(keys: string, ...styles: StaticStyle[]): string {
	return `<kbd class="${cx(kbd.base, ...styles)}">${esc(keys)}</kbd>`
}
