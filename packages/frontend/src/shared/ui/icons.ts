import { ICON_DATA } from '@shared/ui/icon-data'

const iconSymbols = Object.entries(ICON_DATA)
	.map(
		([id, { vb, body }]) =>
			`<symbol id="${id}" viewBox="${vb}">${body}</symbol>`,
	)
	.join('')

export const ICON_SPRITE = `<svg data-syneva-icons aria-hidden="true" width="0" height="0" style="position:absolute">${iconSymbols}</svg>`

let hasInjected = false
export function ensureIcons(): void {
	if (hasInjected) return
	const holder = document.createElement('div')
	holder.innerHTML = ICON_SPRITE
	const svg = holder.firstElementChild
	if (svg) document.body.appendChild(svg)
	hasInjected = true
}
