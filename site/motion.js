const scenes = [...document.querySelectorAll('.motion-scene')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const revealGroups = [...document.querySelectorAll('[data-reveal]')]
const circuit = document.querySelector('.circuit')
const compactCircuit = window.matchMedia('(max-width: 600px)')
const midpointRatio = 0.5

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
		compactCircuit.matches ? '130 0 900 520' : '0 0 1160 480',
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
		const length = path.getTotalLength()
		svg.querySelector(`.flow-signal[href="#${path.id}"]`).style.setProperty(
			'--route-length',
			`${length}px`,
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
compactCircuit.addEventListener('change', updateCircuitFrame)
updateCircuitFrame()

function updateMotion() {
	const globalPause = reducedMotion.matches || document.hidden
	scenes.forEach(scene => {
		const isPaused = globalPause || !scene.classList.contains('is-visible')
		const animations = scene
			.querySelector('svg')
			.getAnimations({ subtree: true })
		animations.forEach(animation => {
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
	{ threshold: 0.1 },
)
scenes.forEach(scene => visibilityObserver.observe(scene))
reducedMotion.addEventListener('change', updateMotion)
document.addEventListener('visibilitychange', updateMotion)

// Reveal groups arrive once: children stagger in, the top rule draws itself.
// Registered after the html.js boot class exists, so the hidden state is already
// in effect when is-inview lands and the transition actually plays. The observer
// stays in module scope: a local one can be garbage-collected mid-session.
const countUp = el => {
	const target = Number(el.dataset.count)
	if (reducedMotion.matches || !Number.isFinite(target)) return
	const durationMs = 900
	const startedAt = performance.now()
	const tick = now => {
		const progress = Math.min((now - startedAt) / durationMs, 1)
		const eased = 1 - (1 - progress) ** 3
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
	{ threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
)

function armReveals() {
	revealGroups.forEach(group => {
		group.querySelectorAll('[data-reveal-item]').forEach((item, i) => {
			item.style.setProperty('--reveal-i', Math.min(i, 9))
		})
		revealObserver.observe(group)
	})
}

const copyButton = document.querySelector('.copy-command')
const installCommand = document.querySelector('#install-command')
const copyStatus = document.querySelector('.copy-status')
const copyFeedbackMs = 1800
let copyReset
copyButton.addEventListener('click', async () => {
	try {
		await navigator.clipboard.writeText(installCommand.value)
		copyStatus.textContent = 'Copied. Paste it into your terminal.'
		copyButton.classList.add('is-copied')
		clearTimeout(copyReset)
		copyReset = setTimeout(
			() => copyButton.classList.remove('is-copied'),
			copyFeedbackMs,
		)
	} catch {
		copyButton.classList.remove('is-copied')
		installCommand.focus()
		installCommand.select()
		copyStatus.textContent =
			'Copy unavailable. Select the command and copy it manually.'
	}
})

const fontWaitMs = 300
const fontsReady = document.fonts.ready
updateMotion()
await Promise.race([
	fontsReady,
	new Promise(resolve => {
		setTimeout(resolve, fontWaitMs)
	}),
])
document.documentElement.classList.add('js', 'is-booted')
armReveals()
updateMotion()
