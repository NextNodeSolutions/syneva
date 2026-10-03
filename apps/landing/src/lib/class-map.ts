import { sx } from './sx'

import type { Style } from './sx'

// Markup kept as an HTML string (a code listing whose whitespace is part of
// the content) names its parts with plain classes; this swaps each class
// list for the merged StyleX classes of its styles, in order, so a modifier
// overrides its base.
export function mapClasses(
	html: string,
	styles: Record<string, Style>,
): string {
	return html.replaceAll(/class="([^"]+)"/g, (_match, names: string) => {
		const merged = sx(...names.split(' ').map(name => styles[name]))
		return `class="${merged.class ?? ''}"`
	})
}
