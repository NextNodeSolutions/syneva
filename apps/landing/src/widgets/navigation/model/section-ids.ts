import type { Section } from '@entities/site/model/site-map'

// The ids that tie a section's trigger to its panel (aria-controls,
// aria-labelledby); the runtime finds a trigger's panel through them.
export const triggerId = ({ id }: Pick<Section, 'id'>): string =>
	`${id}-trigger`

export const panelId = ({ id }: Pick<Section, 'id'>): string => `${id}-menu`
