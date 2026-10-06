// The rail's labels, for every [data-tip] control under `scope`: shown beside the control a
// mouse rests on (after a beat, so a pointer crossing the rail lights nothing; at once while
// it moves from one icon to the next) or that holds keyboard focus, hidden on leaving,
// pressing or scrolling. A tap on a touch screen never shows one. The tip is one fixed element
// the caller renders outside the sidebar.
const SHOW_DELAY_MS = 150
// How long a hidden tip stays warm: the next icon within it labels itself at once.
const WARM_MS = 300
const GAP_PX = 10
const HALF = 2

type Tips = { scope: HTMLElement; tip: HTMLElement }

function hostOf(
	target: EventTarget | null,
	scope: HTMLElement,
): HTMLElement | null {
	if (!(target instanceof Element)) return null
	const host = target.closest<HTMLElement>('[data-tip]')
	if (!host || !scope.contains(host)) return null
	return host
}

function place(tip: HTMLElement, host: HTMLElement): void {
	const box = host.getBoundingClientRect()
	const middle = box.top + box.height / HALF
	tip.replaceChildren(host.dataset.tip ?? '')
	tip.style.setProperty(
		'translate',
		`${box.right + GAP_PX}px calc(${middle}px - 50%)`,
	)
	tip.style.setProperty('opacity', '1')
}

// Follow the controls under the scope; returns the teardown.
export function followTips({ scope, tip }: Tips): () => void {
	let timer = 0
	let warmUntil = 0
	const hide = (): void => {
		window.clearTimeout(timer)
		if (tip.style.opacity === '1') warmUntil = performance.now() + WARM_MS
		tip.style.setProperty('opacity', '0')
	}
	const onOver = (event: PointerEvent): void => {
		const host = hostOf(event.target, scope)
		if (!host || event.pointerType === 'touch') return
		window.clearTimeout(timer)
		const delay = performance.now() < warmUntil ? 0 : SHOW_DELAY_MS
		timer = window.setTimeout(() => place(tip, host), delay)
	}
	const onOut = (event: PointerEvent): void => {
		const host = hostOf(event.target, scope)
		const next =
			event.relatedTarget instanceof Node ? event.relatedTarget : null
		if (host && !host.contains(next)) hide()
	}
	const onFocus = (event: FocusEvent): void => {
		const host = hostOf(event.target, scope)
		if (host?.matches(':focus-visible')) place(tip, host)
	}
	scope.addEventListener('pointerover', onOver)
	scope.addEventListener('pointerout', onOut)
	scope.addEventListener('focusin', onFocus)
	scope.addEventListener('focusout', hide)
	scope.addEventListener('pointerdown', hide)
	window.addEventListener('scroll', hide, { capture: true, passive: true })
	return (): void => {
		hide()
		scope.removeEventListener('pointerover', onOver)
		scope.removeEventListener('pointerout', onOut)
		scope.removeEventListener('focusin', onFocus)
		scope.removeEventListener('focusout', hide)
		scope.removeEventListener('pointerdown', hide)
		window.removeEventListener('scroll', hide, { capture: true })
	}
}
