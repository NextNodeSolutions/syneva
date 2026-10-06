import { queries } from '@syneva/design-system/media.stylex'

// data-compact="x y w h": on a phone the viewBox swaps onto the subject instead of shrinking labels into microtext; the drawing's own viewBox returns on wider screens.
type Frames = { svg: Element; wide: string; compact: string }

// Drawing.astro writes both frames on every drawing it reframes.
function framesOf(svg: Element): Frames {
	const wide = svg.getAttribute('viewBox')
	const compact = svg.getAttribute('data-compact')
	if (!wide || !compact)
		throw new Error(
			`The drawing #${svg.id} reframes on phones without both a viewBox and a data-compact frame: render it with Drawing.astro.`,
		)
	return { svg, wide, compact }
}

export function watchFrames(): void {
	const phone = matchMedia(queries.phone)
	const drawings = [...document.querySelectorAll('svg[data-compact]')].map(
		framesOf,
	)
	const reframe = (): void => {
		for (const { svg, wide, compact } of drawings)
			svg.setAttribute('viewBox', phone.matches ? compact : wide)
	}
	phone.addEventListener('change', reframe)
	reframe()
}
