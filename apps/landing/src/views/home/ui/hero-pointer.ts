import { queries } from '@syneva/design-system/media.stylex'
import { reducedMotion } from '@syneva/motion/preference'

import type { Scope } from './hero-timeline'

// Depth on pointer: the instrument's three columns drift a few pixels apart
// (a CSS transition on `translate` eases them), and the field's registration
// crosses light up around the cursor. Touch devices get neither.
const DEPTHS = { agent: 5, desk: 9, ledger: 13 } as const
const VERTICAL = 0.6
const CENTER = 0.5
const PRECISION = 2

export function bindPointer(hero: HTMLElement, { one }: Scope): void {
	if (!matchMedia(queries.finePointer).matches) return
	const layers = [
		{ layer: one('agent'), depth: DEPTHS.agent },
		{ layer: one('desk'), depth: DEPTHS.desk },
		{ layer: one('ledger'), depth: DEPTHS.ledger },
	].flatMap(({ layer, depth }) =>
		layer instanceof SVGElement ? [{ layer, depth }] : [],
	)
	let frame = 0
	hero.addEventListener('pointermove', event => {
		cancelAnimationFrame(frame)
		frame = requestAnimationFrame(() => {
			if (reducedMotion.matches) return
			const box = hero.getBoundingClientRect()
			const x = event.clientX - box.left
			const y = event.clientY - box.top
			hero.style.setProperty('--mx', `${x}px`)
			hero.style.setProperty('--my', `${y}px`)
			hero.classList.add('is-lit')
			const dx = x / box.width - CENTER
			const dy = y / box.height - CENTER
			layers.forEach(({ layer, depth }) => {
				layer.style.setProperty(
					'translate',
					`${(dx * depth).toFixed(PRECISION)}px ${(dy * depth * VERTICAL).toFixed(PRECISION)}px`,
				)
			})
		})
	})
	hero.addEventListener('pointerleave', () => {
		hero.classList.remove('is-lit')
		layers.forEach(({ layer }) => {
			layer.style.setProperty('translate', '0 0')
		})
	})
}
