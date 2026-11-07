import { sx } from './sx'

import type { Style } from './sx'

// HTML-string copy (the FAQ's answers) keeps its inline tags; this maps chosen tags to StyleX classes so they style like markup.
export function richText(
	html: string,
	styles: Partial<Record<'a' | 'code', Style>>,
): string {
	return Object.entries(styles).reduce((styled, [tag, style]) => {
		const { class: names } = sx(style)
		// The name must end the tag's opening: `<a` would otherwise match `<abbr` or `<aside`.
		const opening = new RegExp(`<${tag}(?=[\\s/>])`, 'g')
		return names
			? styled.replaceAll(opening, `<${tag} class="${names}"`)
			: styled
	}, html)
}
