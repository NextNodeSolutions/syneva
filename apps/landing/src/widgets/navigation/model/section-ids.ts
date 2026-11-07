import type { Section } from '@entities/site/model/site-map'

export const triggerId = ({ id }: Pick<Section, 'id'>): string =>
	`${id}-trigger`

export const panelId = ({ id }: Pick<Section, 'id'>): string => `${id}-menu`
