// Page motion: scene pausing, one-shot reveals, stat count-up, the review
// circuit's routing, responsive drawing frames and clipboard feedback. Shared
// by every page; each part no-ops when its markup is absent.
const scenes = [...document.querySelectorAll('.motion-scene')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const revealGroups = [...document.querySelectorAll('[data-reveal]')]
const compact = window.matchMedia('(max-width: 600px)')
const midpointRatio = 0.5

// --- the review circuit: wires are routed from the ports' live positions ---
const circuit = document.querySelector('.circuit')

function portPosition(svg, id) {
	const port = svg.querySelector(`#${id}`)
	const point = new DOMPoint(port.cx.baseVal.value, port.cy.baseVal.value)
	return point
		.matrixTransform(port.getCTM())
		.matrixTransform(svg.getCTM().inverse())
}

function connectionPath(from, to) {
	const middleX = (from.x + to.x) * midpointRatio
	return `M${from.x} ${from.y}C${middleX} ${from.y} ${middleX} ${to.y} ${to.x} ${to.y}`
}

function returnPath(from, to) {
	const clearance = 44
	const radius = 16
	const bottom = Math.max(from.y, to.y) + clearance
	return `M${from.x} ${from.y}V${bottom - radius}q0 ${radius} ${-radius} ${radius}H${to.x + radius}q${-radius} 0 ${-radius} ${-radius}V${to.y}`
}

function updateCircuitFrame() {
	const svg = circuit.querySelector('svg')
	svg.setAttribute(
		'viewBox',
		compact.matches ? '130 0 900 520' : '0 0 1160 480',
	)
	// Ports include their responsive station transforms. The wire and signal
	// cannot disagree, because each signal references the wire with SVG <use>.
	svg.querySelectorAll('[data-from]').forEach(path => {
		const from = portPosition(svg, path.dataset.from)
		const to = portPosition(svg, path.dataset.to)
		const isReturn = path.dataset.route === 'return'
		path.setAttribute(
			'd',
			isReturn ? returnPath(from, to) : connectionPath(from, to),
		)
		svg.querySelector(`.flow-signal[href="#${path.id}"]`).style.setProperty(
			'--route-length',
			`${path.getTotalLength()}px`,
		)
	})
	const route = svg.querySelector('#flow-return')
	const midpoint = route.getPointAtLength(
		route.getTotalLength() * midpointRatio,
	)
	const label = svg.querySelector('.loop-label')
	const labelGap = 24
	label.setAttribute('x', midpoint.x)
	label.setAttribute('y', midpoint.y + labelGap)
}

// --- drawings that reframe on phones declare data-compact="x y w h" ---
const reframed = [...document.querySelectorAll('svg[data-compact]')]
reframed.forEach(svg => {
	svg.dataset.wide = svg.getAttribute('viewBox')
})
function updateFrames() {
	reframed.forEach(svg => {
		svg.setAttribute(
			'viewBox',
			compact.matches ? svg.dataset.compact : svg.dataset.wide,
		)
	})
	if (circuit) updateCircuitFrame()
}
compact.addEventListener('change', updateFrames)
updateFrames()

// --- offscreen scenes and hidden tabs pause ---
function updateMotion() {
	const globalPause = reducedMotion.matches || document.hidden
	document.documentElement.toggleAttribute('data-motion-paused', globalPause)
	scenes.forEach(scene => {
		const isPaused = globalPause || !scene.classList.contains('is-visible')
		scene.getAnimations({ subtree: true }).forEach(animation => {
			if (isPaused) animation.pause()
			else if (animation.playState === 'paused') animation.play()
		})
	})
}

const visibilityObserver = new IntersectionObserver(
	entries => {
		entries.forEach(entry => {
			entry.target.classList.toggle('is-visible', entry.isIntersecting)
		})
		updateMotion()
	},
	{ threshold: 0.05 },
)
scenes.forEach(scene => visibilityObserver.observe(scene))
reducedMotion.addEventListener('change', updateMotion)
document.addEventListener('visibilitychange', updateMotion)
// Scenes that start animating later (a reveal) re-check once they do; a burst
// of animationstart events collapses into one check per frame.
let motionCheck = 0
document.addEventListener(
	'animationstart',
	() => {
		cancelAnimationFrame(motionCheck)
		motionCheck = requestAnimationFrame(updateMotion)
	},
	{ passive: true },
)

// Reveal groups arrive once: children stagger in, the top rule draws itself.
// Registered after the boot class exists, so the hidden state is already in
// effect when is-inview lands and the transition actually plays. The observer
// stays in module scope: a local one can be garbage-collected mid-session.
const countUp = el => {
	const target = Number(el.dataset.count)
	if (reducedMotion.matches || !Number.isFinite(target)) return
	const durationMs = 1100
	const startedAt = performance.now()
	const tick = now => {
		const progress = Math.min((now - startedAt) / durationMs, 1)
		const eased = 1 - (1 - progress) ** 4
		el.firstChild.textContent = Math.round(target * eased)
		if (progress < 1) requestAnimationFrame(tick)
	}
	requestAnimationFrame(tick)
}

const revealObserver = new IntersectionObserver(
	entries => {
		entries.forEach(entry => {
			if (!entry.isIntersecting) return
			entry.target.classList.add('is-inview')
			entry.target.querySelectorAll('[data-count]').forEach(countUp)
			revealObserver.unobserve(entry.target)
		})
	},
	{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
)

function armReveals() {
	revealGroups.forEach(group => {
		group.querySelectorAll('[data-reveal-item]').forEach((item, i) => {
			item.style.setProperty('--reveal-i', Math.min(i, 9))
		})
		revealObserver.observe(group)
	})
}

// --- copy buttons: every .command carries its own input and status ---
const copyFeedbackMs = 1800
document.querySelectorAll('.command').forEach(command => {
	const button = command.querySelector('.copy-command')
	const input = command.querySelector('input')
	const status = command.querySelector('.copy-status')
	let reset
	button.addEventListener('click', async () => {
		clearTimeout(reset)
		try {
			await navigator.clipboard.writeText(input.value)
			status.textContent = 'Copied. Paste it into your terminal.'
			status.classList.remove('is-error')
			button.classList.add('is-copied')
		} catch {
			button.classList.remove('is-copied')
			input.focus()
			input.select()
			status.textContent = 'Copy unavailable. The command is selected.'
			status.classList.add('is-error')
		}
		reset = setTimeout(() => {
			button.classList.remove('is-copied')
			status.textContent = ''
		}, copyFeedbackMs)
	})
	// A click into the field selects the whole command, ready to copy.
	input.addEventListener('focus', () => input.select())
})

const fontWaitMs = 300
await Promise.race([
	document.fonts.ready,
	new Promise(resolve => {
		setTimeout(resolve, fontWaitMs)
	}),
])
document.documentElement.classList.add('js', 'is-booted')
// Fonts can shift the ports a pixel; route the circuit against final metrics.
updateFrames()
armReveals()
updateMotion()
