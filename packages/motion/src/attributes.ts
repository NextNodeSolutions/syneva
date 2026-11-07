// The markup writes these names and the runtime selects them, so the two sides of the package boundary cannot drift apart.
export const ATTRIBUTE = {
	revealGroup: 'data-reveal',
	revealItem: 'data-reveal-item',
	rule: 'data-rule',
	count: 'data-count',
	scene: 'data-motion-scene',
	anim: 'data-anim',
	delay: 'data-delay',
} as const
