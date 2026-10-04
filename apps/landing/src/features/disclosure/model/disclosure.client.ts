import { EASE } from '@syneva/motion/easing'
import { animate } from '@syneva/motion/engine'
import { reducedMotion } from '@syneva/motion/preference'

// Disclosure rows ([data-disclosure], see Disclosure.astro) ease open and
// shut instead of jumping. The native <details> stays the source of truth
// (keyboard, find-in-page and no-JS keep working); the script only animates
// the height between its two states. Closing keeps [open] until the motion
// ends so the answer stays visible while it folds away; .is-closing turns the
// chevron back early (disclosure.styles.ts). Every run starts from the
// row's current height and the answer's current opacity, so a reversal or a
// re-measure continues instead of jumping.
const DURATION_S = 0.34
const RISE_PX = 6
const ease = EASE.out

// Rows mid-motion re-measure when text can rewrap (resize, a late font), so
// they glide to the new height instead of snapping to it when they finish.
const moving = new Set<() => void>()
const remeasure = (): void => {
	moving.forEach(run => run())
}

function clearAnswer(answer: HTMLElement | null): void {
	answer?.getAnimations().forEach(animation => animation.cancel())
	answer?.style.removeProperty('opacity')
	answer?.style.removeProperty('transform')
}

function fadeAnswer(
	answer: HTMLElement | null,
	fade: number,
	isOpening: boolean,
): void {
	if (!answer) return
	// The closing fade holds at 0 until the row folds shut, so the answer never
	// pops back to full opacity in the last frames.
	const keyframes = isOpening
		? {
				opacity: [fade, 1],
				transform: [`translateY(${(fade - 1) * RISE_PX}px)`, 'none'],
			}
		: { opacity: [fade, 0] }
	animate(answer, keyframes, { duration: DURATION_S, ease })
}

function bindDisclosure(details: HTMLDetailsElement): void {
	const summary = details.querySelector('summary')
	if (!summary) return
	const answer =
		summary.nextElementSibling instanceof HTMLElement
			? summary.nextElementSibling
			: null
	let isOpening = false
	const settle = (): void => {
		if (!isOpening) details.removeAttribute('open')
		details.classList.remove('is-closing')
		details.style.removeProperty('overflow')
		details.style.removeProperty('height')
		clearAnswer(answer)
		moving.delete(run)
	}
	const run = (): void => {
		// Measure before stopping: the running animations hold the live values.
		const from = details.getBoundingClientRect().height
		// A shut row's answer is not rendered, so it fades in from nothing.
		const fade =
			answer && details.open
				? Number(getComputedStyle(answer).opacity)
				: 0
		details.getAnimations().forEach(animation => animation.cancel())
		clearAnswer(answer)
		details.classList.toggle('is-closing', !isOpening)
		if (isOpening) details.setAttribute('open', '')
		details.style.removeProperty('height')
		const borders = details.offsetHeight - details.clientHeight
		const to = isOpening
			? details.offsetHeight
			: summary.offsetHeight + borders
		details.style.setProperty('overflow', 'hidden')
		moving.add(run)
		// The fade starts first so the height's completion, which clears both,
		// always runs after the fade committed its last frame.
		fadeAnswer(answer, fade, isOpening)
		animate(
			details,
			{ height: [`${from}px`, `${to}px`] },
			{ duration: DURATION_S, ease, onComplete: settle },
		)
	}
	summary.addEventListener('click', event => {
		if (reducedMotion.matches) return
		event.preventDefault()
		isOpening = !details.open || details.classList.contains('is-closing')
		run()
	})
}

export function bindDisclosures(): void {
	window.addEventListener('resize', remeasure, { passive: true })
	document.fonts.addEventListener('loadingdone', remeasure)
	for (const row of document.querySelectorAll('[data-disclosure]'))
		if (row instanceof HTMLDetailsElement) bindDisclosure(row)
}
