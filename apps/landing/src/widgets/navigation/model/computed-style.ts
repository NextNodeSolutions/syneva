// Reads the stylesheet values the runtime animates by, from a computed style.
const MS_PER_S = 1000

export const readProperty = (
	styles: CSSStyleDeclaration,
	name: string,
): string => styles.getPropertyValue(name).trim()

// The clock is written in ms but the CSS minifier may print it in seconds
// (240ms becomes .24s), so the unit decides the scale.
export function toSeconds(time: string): number {
	const amount = Number.parseFloat(time)
	return time.endsWith('ms') ? amount / MS_PER_S : amount
}
