// Boot: wait briefly for the webfonts (their metrics move drawings by a
// pixel), then mark the root ready. Until then the inline head script's
// data-motion="pending" keeps the hidden poses and the safety net armed.
// Every page script awaits the same promise, so they all start on one beat.
const FONT_WAIT_MS = 300

async function settle(): Promise<void> {
	await Promise.race([
		document.fonts.ready,
		new Promise(resolve => {
			setTimeout(resolve, FONT_WAIT_MS)
		}),
	])
	document.documentElement.dataset.motion = 'ready'
}

let ready: Promise<void> | undefined

export function booted(): Promise<void> {
	ready ??= settle()
	return ready
}

// A printout is the finished page: the poses are disarmed for the print
// styles and re-armed afterwards (revealed pieces keep their inline pose).
window.addEventListener('beforeprint', () => {
	delete document.documentElement.dataset.motion
})
window.addEventListener('afterprint', () => {
	document.documentElement.dataset.motion = 'ready'
})

// The inline head script, verbatim: arms the poses before the first paint.
export const ARM_SCRIPT = "document.documentElement.dataset.motion='pending'"
