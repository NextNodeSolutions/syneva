import { queries } from '@syneva/design-system/media.stylex'

// Drawings that reframe on phones declare data-compact="x y w h": on a phone
// the viewBox swaps onto their subject instead of shrinking labels into
// microtext, and data-wide keeps the drawing's own viewBox to swap back to.
export function watchFrames(): void {
	const phone = matchMedia(queries.phone)
	const drawings = [...document.querySelectorAll('svg[data-compact]')]
	for (const svg of drawings)
		svg.setAttribute('data-wide', svg.getAttribute('viewBox') ?? '')
	const reframe = (): void => {
		const source = phone.matches ? 'data-compact' : 'data-wide'
		for (const svg of drawings) {
			const frame = svg.getAttribute(source)
			if (frame) svg.setAttribute('viewBox', frame)
		}
	}
	phone.addEventListener('change', reframe)
	reframe()
}
