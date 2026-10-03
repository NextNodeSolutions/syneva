import { sx } from './sx'

import type { Style } from './sx'

// Copy written as HTML strings (answers, list items) keeps its inline tags;
// this gives chosen tags their StyleX classes so they style like markup.
export function richText(
	html: string,
	styles: Partial<Record<'a' | 'code', Style>>,
): string {
	return Object.entries(styles).reduce((styled, [tag, style]) => {
		const { class: names } = sx(style)
		return names
			? styled.replaceAll(`<${tag}`, `<${tag} class="${names}"`)
			: styled
	}, html)
}
