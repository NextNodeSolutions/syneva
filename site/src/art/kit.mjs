// Small helpers shared by every drawing module.
export { artFrame } from '../ui.mjs'

// Inline motion parameters: --d delays an entrance, --tx/--ty give .a-move
// its starting offset (the markup position is always the resting one).
export const d = (seconds, extra = '') =>
	`style="--d:${seconds}s${extra ? `;${extra}` : ''}"`
export const from = (seconds, x, y) => d(seconds, `--tx:${x}px;--ty:${y}px`)

export const check = (x, y, size = 11, delay) =>
	`<g${delay === undefined ? '' : ` class="a-pop" ${d(delay)}`}><rect class="art-yes" x="${x}" y="${y}" width="${size}" height="${size}"/><path class="art-check" d="m${x + size * 0.25} ${y + size * 0.52}l${size * 0.18} ${size * 0.18} ${size * 0.33}-${size * 0.37}"/></g>`
export const cross = (x, y, size = 11, delay) =>
	`<g${delay === undefined ? '' : ` class="a-pop" ${d(delay)}`}><rect class="art-no" x="${x}" y="${y}" width="${size}" height="${size}"/><path class="art-x" d="m${x + size * 0.3} ${y + size * 0.3} ${size * 0.4} ${size * 0.4}m0-${size * 0.4}-${size * 0.4} ${size * 0.4}"/></g>`
export const pending = (x, y, size = 11) =>
	`<rect class="art-pending" x="${x}" y="${y}" width="${size}" height="${size}"/>`
