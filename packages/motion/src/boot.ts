import { ROOT_STATE } from './poses'

// Boot: wait briefly for the webfonts (their metrics move drawings by a pixel), then mark the root ready; until then the pending state ARM_SCRIPT sets keeps poses and safety net armed.
// Every page script awaits the same promise, so they all start on one beat.
const FONT_WAIT_MS = 300

async function settle(): Promise<void> {
	await Promise.race([
		document.fonts.ready,
		new Promise(resolve => {
			setTimeout(resolve, FONT_WAIT_MS)
		}),
	])
	document.documentElement.setAttribute(
		ROOT_STATE.attribute,
		ROOT_STATE.ready,
	)
}

// A printout is the finished page: disarm for the print style, re-arm after (revealed pieces keep their inline pose).
function watchPrint(): void {
	window.addEventListener('beforeprint', () => {
		document.documentElement.removeAttribute(ROOT_STATE.attribute)
	})
	window.addEventListener('afterprint', () => {
		document.documentElement.setAttribute(
			ROOT_STATE.attribute,
			ROOT_STATE.ready,
		)
	})
}

let ready: Promise<void> | undefined

// Page scripts only: at build time (Document.astro inlines ARM_SCRIPT) there is no window.
export function booted(): Promise<void> {
	if (!ready) {
		watchPrint()
		ready = settle()
	}
	return ready
}

// Arms the poses before the first paint (inlined verbatim in Document.astro).
export const ARM_SCRIPT = `document.documentElement.setAttribute('${ROOT_STATE.attribute}','${ROOT_STATE.pending}')`
