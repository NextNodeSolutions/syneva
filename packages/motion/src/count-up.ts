import { cancelFrame, frame } from './engine'

import type { FrameData } from './engine'

// A product fact counts up from zero the first time its section arrives. It
// only rewrites text, so it rides Motion's frame loop (batched with every
// other read and write) rather than a style animation.
const COUNT_MS = 1100
const QUART = 4
const quartOut = (progress: number): number => 1 - (1 - progress) ** QUART

export function countUp(element: HTMLElement): void {
	const target = Number(element.dataset.count)
	const digits = element.firstChild
	if (!Number.isFinite(target) || !digits) return
	const startedAt = performance.now()
	const tick = ({ timestamp }: FrameData): void => {
		const progress = Math.min(
			Math.max(timestamp - startedAt, 0) / COUNT_MS,
			1,
		)
		digits.textContent = String(Math.round(target * quartOut(progress)))
		if (progress === 1) cancelFrame(tick)
	}
	frame.update(tick, true)
}
