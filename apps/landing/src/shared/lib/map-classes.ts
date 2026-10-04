import { sx } from './sx'

import type { Style } from './sx'

// A class the markup names but the styles lack would drop its look without
// a trace, so it fails the build instead.
function styleOf(styles: Record<string, Style>, name: string): Style {
	if (!Object.hasOwn(styles, name))
		throw new Error(
			`The markup names the class "${name}", which has no style: add it to the styles mapClasses() receives.`,
		)
	return styles[name]
}

// Markup kept as an HTML string (a code listing whose whitespace is part of
// the content) names its parts with plain classes; this swaps each class
// list for the merged StyleX classes of its styles, in order, so a modifier
// overrides its base.
export function mapClasses(
	html: string,
	styles: Record<string, Style>,
): string {
	return html.replaceAll(/class="([^"]+)"/g, (_match, names: string) => {
		const merged = sx(
			...names.split(' ').map(name => styleOf(styles, name)),
		)
		return `class="${merged.class ?? ''}"`
	})
}
