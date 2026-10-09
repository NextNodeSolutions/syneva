import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// A risk level as the design system's tag triad, named in words beside its tint: red for critical, amber for high, petrol for medium, neutral for low - the hue never carries the meaning alone.
export const riskTag = stylex.create({
	critical: { color: color['--red'], backgroundColor: color['--red-tint'] },
	high: { color: color['--amber'], backgroundColor: color['--amber-tint'] },
	medium: { color: color['--accent'], backgroundColor: color['--wash'] },
	low: { color: color['--muted'], backgroundColor: color['--field'] },
})
