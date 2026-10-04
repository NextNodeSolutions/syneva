const MS_PER_S = 1000

// The clock is written in ms but the CSS minifier may print it in seconds
// (240ms becomes .24s), so the unit decides the scale.
export function toSeconds(time: string): number {
	const amount = Number.parseFloat(time)
	return time.endsWith('ms') ? amount / MS_PER_S : amount
}
