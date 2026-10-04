import { readProperty } from './read-property'

import type { navClock } from '../ui/nav.stylex'

// The morph's clock variables by name; nav.stylex.ts holds their values.
export type ClockName = Extract<keyof typeof navClock, `--${string}`>

export const readClock = (
	styles: CSSStyleDeclaration,
	name: ClockName,
): string => readProperty(styles, name)
