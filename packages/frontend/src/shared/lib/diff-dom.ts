import { $ } from '@shared/lib/dom'

// Pierre's shadow root is cached and invalidated structurally: reused only while its host still lives under #diff, so a file switch or a remount flips the check and a stale root can never be handed back to the cursor.
let cached: ShadowRoot | null = null

export function diffShadowRoot(): ShadowRoot | null {
	if (cached && $('diff').contains(cached.host)) return cached
	let shadow: ShadowRoot | null = null
	$('diff')
		.querySelectorAll('*')
		.forEach(el => {
			if (el.shadowRoot) shadow = el.shadowRoot
		})
	cached = shadow
	return shadow
}
