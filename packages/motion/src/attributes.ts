// The data-* attributes through which the markup opts into the runtime. The
// landing writes them and the runtime selects them, both from these names,
// so the two sides of the package boundary cannot drift apart.
export const ATTRIBUTE = {
	// A section whose items and drawings arrive once (reveal.ts).
	revealGroup: 'data-reveal',
	revealItem: 'data-reveal-item',
	// A reveal group that also draws an accent rule over its top border.
	rule: 'data-rule',
	// A product fact that counts up to its value (count-up.ts).
	count: 'data-count',
	// A figure whose animations pause while it is out of view (scenes.ts).
	scene: 'data-motion-scene',
	// A drawing element's vocabulary kind and its delay (vocabulary.ts).
	anim: 'data-anim',
	delay: 'data-delay',
} as const
