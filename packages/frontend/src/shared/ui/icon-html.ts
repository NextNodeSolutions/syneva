import { cx } from '@shared/lib/cx'

import { icon } from './icon.styles'

import type { StaticStyle } from '@shared/lib/cx'

// The Icon primitive as markup, for the diff island's templates: the same
// sprite reference and base size the React chrome renders.
export function iconHtml(id: string, ...styles: StaticStyle[]): string {
	return `<svg class="${cx(icon.base, ...styles)}" aria-hidden="true"><use href="#${id}"></use></svg>`
}
