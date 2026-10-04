// Drawings that reframe on phones declare data-compact="x y w h": below
// 600px the viewBox swaps onto their subject instead of shrinking labels into
// microtext. Listeners (the review circuit) re-route after every swap.
export const compact = matchMedia('(max-width: 600px)')

const reframed = [...document.querySelectorAll('svg[data-compact]')]
reframed.forEach(svg => {
	svg.setAttribute('data-wide', svg.getAttribute('viewBox') ?? '')
})

export function updateFrames(): void {
	reframed.forEach(svg => {
		const frame = compact.matches
			? svg.getAttribute('data-compact')
			: svg.getAttribute('data-wide')
		if (frame) svg.setAttribute('viewBox', frame)
	})
}

compact.addEventListener('change', updateFrames)
updateFrames()
