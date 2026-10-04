import { sx } from './sx'

import type { Style } from './sx'

// Copy written as HTML strings (the FAQ's answers) keeps its inline tags;
// this gives chosen tags their StyleX classes so they style like markup.
export function richText(
	html: string,
	styles: Partial<Record<'a' | 'code', Style>>,
): string {
	return Object.entries(styles).reduce((styled, [tag, style]) => {
		const { class: names } = sx(style)
		// The name ends the tag's opening: <a must not match <abbr or <aside.
		const opening = new RegExp(`<${tag}(?=[\\s/>])`, 'g')
		return names
			? styled.replaceAll(opening, `<${tag} class="${names}"`)
			: styled
	}, html)
}
