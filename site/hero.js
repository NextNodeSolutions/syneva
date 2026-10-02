// The hero instrument's timeline. One 16s clock drives every element with the
// Web Animations API, so the round can never drift out of sync: files settle
// into a reading order, one change opens on the desk, you ask, the agent
// answers, you accept, the ledger fills, Send goes back to the agent and only
// the rejected file returns pending. The SVG markup is the static pose; with
// reduced motion nothing here runs. motion.js pauses the scene offscreen.
const hero = document.querySelector('.hero')
const svg = hero?.querySelector('svg.hs')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const CYCLE_S = 16
const START_DELAY_MS = 900
const EASE = 'cubic-bezier(.2, 0, 0, 1)'
const IN_OUT = 'cubic-bezier(.65, 0, .35, 1)'
const SPRING = 'cubic-bezier(.34, 1.45, .5, 1)'
const LINEAR = 'linear'
// The loop closes by fading the round out, so the next one starts clean.
const FADE_START = 15.1
const FADE_END = 15.7

// Literal colors: keyframe values are resolved without custom properties.
const COLOR = {
	white: '#ffffff',
	mint: '#e0eddf',
	paleMint: '#f2f7f0',
	green: '#35633f',
	strong: '#a8afa1',
	muted: '#60635c',
	accent: '#cc3b08',
	accentDeep: '#a93108',
}

// frames: [[seconds, props, easing for the segment that starts here], ...]
function track(element, frames, easing = EASE) {
	if (!element) return
	const keyframes = frames.map(([time, props, segment]) => ({
		offset: time / CYCLE_S,
		easing: segment ?? easing,
		...props,
	}))
	if (keyframes[0].offset > 0) keyframes.unshift({ ...keyframes[0], offset: 0 })
	if (keyframes.at(-1).offset < 1)
		keyframes.push({ ...keyframes.at(-1), offset: 1 })
	element.animate(keyframes, {
		duration: CYCLE_S * 1000,
		delay: START_DELAY_MS,
		iterations: Infinity,
		fill: 'backwards',
	})
}

const $ = selector => svg.querySelector(selector)
const $$ = selector => [...svg.querySelectorAll(selector)]

// Appear at `start`, stay, and leave with the round.
function present(element, start, length = 0.35, from = {}, to = {}) {
	track(element, [
		[0, { opacity: 0, ...from }],
		[start, { opacity: 0, ...from }],
		[start + length, { opacity: 1, ...to }],
		[FADE_START, { opacity: 1, ...to }],
		[FADE_END, { opacity: 0, ...to }],
	])
}

function travel(element, start, length) {
	track(
		element,
		[
			[0, { opacity: 0, strokeDashoffset: 8 }],
			[start, { opacity: 0, strokeDashoffset: 8 }],
			[start + 0.02, { opacity: 1, strokeDashoffset: 8 }],
			[start + length, { opacity: 1, strokeDashoffset: -100 }],
			[start + length + 0.02, { opacity: 0, strokeDashoffset: -100 }],
		],
		LINEAR,
	)
}

function reveal(element, start, length) {
	const hidden = 'inset(-3px 100% -3px 0)'
	const shown = 'inset(-3px -3px -3px 0)'
	track(element, [
		[0, { clipPath: hidden, opacity: 1 }],
		[start, { clipPath: hidden, opacity: 1 }, LINEAR],
		[start + length, { clipPath: shown, opacity: 1 }],
		[FADE_START, { clipPath: shown, opacity: 1 }],
		[FADE_END, { clipPath: shown, opacity: 0 }],
	])
}

function draw(element, start, length = 0.35) {
	track(element, [
		[0, { strokeDasharray: '1 1', strokeDashoffset: 1, opacity: 1 }],
		[start, { strokeDasharray: '1 1', strokeDashoffset: 1, opacity: 1 }],
		[start + length, { strokeDasharray: '1 1', strokeDashoffset: 0, opacity: 1 }],
		[FADE_START, { strokeDasharray: '1 1', strokeDashoffset: 0, opacity: 1 }],
		[FADE_END, { strokeDasharray: '1 1', strokeDashoffset: 0, opacity: 0 }],
	])
}

function pop(element, start) {
	track(element, [
		[0, { opacity: 0, transform: 'scale(0)' }],
		[start, { opacity: 1, transform: 'scale(0)' }, SPRING],
		[start + 0.4, { opacity: 1, transform: 'none' }],
		[FADE_START, { opacity: 1, transform: 'none' }],
		[FADE_END, { opacity: 0, transform: 'none' }],
	])
}

function choreograph() {
	// 0.0 - 2.4  The agent's files arrive scattered, then settle in order.
	const scattered = [
		'translate(34px, 52px) rotate(-8deg)',
		'translate(62px, -8px) rotate(6deg)',
		'translate(18px, -100px) rotate(-3deg)',
	]
	$$('.hs-card').forEach((card, i) => {
		card.style.transformOrigin = 'center'
		const settle = 1.25 + i * 0.14
		track(card, [
			[0, { opacity: 0, transform: scattered[i] }],
			[0.2 + i * 0.12, { opacity: 0, transform: scattered[i] }],
			[0.55 + i * 0.12, { opacity: 1, transform: scattered[i] }],
			[settle, { opacity: 1, transform: scattered[i] }, SPRING],
			[settle + 0.75, { opacity: 1, transform: 'none' }],
			[FADE_START, { opacity: 1, transform: 'none' }],
			[FADE_END, { opacity: 0, transform: 'none' }],
		])
	})
	$$('.hs-bar').forEach(bar => {
		const card = Number(bar.dataset.bar)
		const row = $$(`.hs-bar[data-bar="${card}"]`).indexOf(bar)
		bar.style.transformOrigin = 'left center'
		bar.style.transformBox = 'fill-box'
		const write = 0.45 + card * 0.16 + row * 0.13
		const frames = [
			[0, { transform: 'scaleX(0)' }],
			[write, { transform: 'scaleX(0)' }],
			[write + 0.4, { transform: 'none' }],
		]
		// The rejected file is rewritten after the verdict comes back.
		if (card === 2)
			frames.push(
				[13.15, { transform: 'none' }],
				[13.35, { transform: 'scaleX(0)' }],
				[13.45 + row * 0.12, { transform: 'scaleX(0)' }],
				[13.9 + row * 0.12, { transform: 'none' }],
			)
		track(bar, frames)
	})
	draw($('.hs-rail'), 2.05, 0.6)
	present($('.hs-rail-dots'), 2.1, 0.4)
	present($('.hs-more'), 2.2, 0.4)
	const focus = $('.hs-focus')
	focus.style.transformOrigin = 'center'
	present(
		focus,
		2.45,
		0.35,
		{ transform: 'scale(1.1)' },
		{ transform: 'none' },
	)

	// Until a change opens, the desk says what it is waiting for.
	track($('.hs-idle'), [
		[0, { opacity: 0 }],
		[0.3, { opacity: 1 }],
		[2.85, { opacity: 1 }],
		[3.05, { opacity: 0 }],
		[FADE_END, { opacity: 0 }],
		[FADE_END + 0.25, { opacity: 1 }],
	])
	track(
		$('.hs-caret'),
		[0, 0.5, 1, 1.5, 2, 2.5].flatMap(time => [
			[time, { opacity: 1 }, 'steps(1, end)'],
			[time + 0.25, { opacity: 0 }, 'steps(1, end)'],
		]),
	)

	// 2.7 - 5.0  The change opens on the desk and you read it.
	travel($('.hs-signal-in'), 2.75, 0.55)
	present($('.hs-head'), 3.05, 0.3)
	$$('.hs-row').forEach((row, i) => reveal(row, 3.2 + i * 0.12, 0.45))
	present($('.hs-band-del'), 3.35, 0.3)
	track($('.hs-band-add'), [
		[0, { opacity: 0, fill: COLOR.paleMint }],
		[3.5, { opacity: 0, fill: COLOR.paleMint }],
		[3.8, { opacity: 1, fill: COLOR.paleMint }],
		[8.45, { opacity: 1, fill: COLOR.paleMint }],
		[8.8, { opacity: 1, fill: COLOR.mint }],
		[FADE_START, { opacity: 1, fill: COLOR.mint }],
		[FADE_END, { opacity: 0, fill: COLOR.mint }],
	])
	const strike = $('.hs-strike')
	strike.style.transformOrigin = 'left center'
	strike.style.transformBox = 'fill-box'
	present(
		strike,
		3.65,
		0.35,
		{ transform: 'scaleX(0)' },
		{ transform: 'none' },
	)
	track($('.hs-sweep'), [
		[0, { opacity: 0, transform: 'translateY(0)' }],
		[4.05, { opacity: 0, transform: 'translateY(0)' }],
		[4.2, { opacity: 1, transform: 'translateY(0)' }, IN_OUT],
		[5.05, { opacity: 1, transform: 'translateY(96px)' }],
		[5.25, { opacity: 0, transform: 'translateY(96px)' }],
	])

	// 5.0 - 7.7  You ask on line 14; your agent answers on the same line.
	const chip = $('.hs-qchip')
	chip.style.transformOrigin = 'center'
	pop(chip, 5.05)
	draw($('.hs-leader'), 5.3, 0.3)
	present(
		$('.hs-thread'),
		5.45,
		0.35,
		{ transform: 'translateY(8px)' },
		{ transform: 'none' },
	)
	reveal($('.hs-msg-you'), 5.75, 0.6)
	track($('.hs-typing'), [
		[0, { opacity: 0 }],
		[6.45, { opacity: 0 }],
		[6.6, { opacity: 1 }],
		[7.05, { opacity: 1 }],
		[7.15, { opacity: 0 }],
	])
	$$('.hs-typing circle').forEach((dot, i) => {
		const beat = 6.55 + i * 0.1
		track(dot, [
			[0, { opacity: 0.3 }],
			[beat, { opacity: 0.3 }],
			[beat + 0.12, { opacity: 1 }],
			[beat + 0.24, { opacity: 0.3 }],
			[beat + 0.36, { opacity: 1 }],
		])
	})
	reveal($('.hs-msg-agent'), 7.1, 0.65)

	// 7.6 - 9.5  Your cursor accepts the change; the verdict travels on.
	const cursor = $('.hs-cursor')
	cursor.style.transformBox = 'view-box'
	cursor.style.transformOrigin = '0 0'
	const at = (x, y, scale = 1) => ({
		transform: `translate(${x}px, ${y}px) scale(${scale})`,
	})
	track(cursor, [
		[0, { opacity: 0, ...at(650, 300) }],
		[7.55, { opacity: 0, ...at(650, 300) }],
		[7.75, { opacity: 1, ...at(650, 300) }, IN_OUT],
		[8.25, { opacity: 1, ...at(504, 86) }],
		[8.32, { opacity: 1, ...at(504, 86, 0.8) }],
		[8.46, { opacity: 1, ...at(504, 86) }],
		[10.35, { opacity: 1, ...at(504, 86) }, IN_OUT],
		[11.05, { opacity: 1, ...at(684, 334) }],
		[11.13, { opacity: 1, ...at(684, 334, 0.8) }],
		[11.27, { opacity: 1, ...at(684, 334) }],
		[11.8, { opacity: 1, ...at(684, 334) }],
		[12.2, { opacity: 0, ...at(700, 350) }],
	])
	track($('.hs-accept'), [
		[0, { fill: COLOR.white, stroke: COLOR.strong }],
		[8.32, { fill: COLOR.white, stroke: COLOR.strong }],
		[8.5, { fill: COLOR.mint, stroke: COLOR.green }],
		[FADE_START, { fill: COLOR.mint, stroke: COLOR.green }],
		[FADE_END, { fill: COLOR.white, stroke: COLOR.strong }],
	])
	track($('.hs-accept-glyph'), [
		[0, { stroke: COLOR.muted }],
		[8.32, { stroke: COLOR.muted }],
		[8.5, { stroke: COLOR.green }],
		[FADE_START, { stroke: COLOR.green }],
		[FADE_END, { stroke: COLOR.muted }],
	])
	$$('.hs-gcheck').forEach((check, i) => draw(check, 8.55 + i * 0.15, 0.3))
	travel($('.hs-signal-out'), 8.95, 0.5)

	// 9.4 - 10.8  Every file gets your verdict; the ledger fills.
	const order = [1, 0, 2, 3, 4, 5]
	$$('.hs-verdict').forEach(verdict => {
		const row = Number(verdict.dataset.row)
		verdict.style.transformOrigin = 'center'
		const start = 9.4 + order.indexOf(row) * 0.2
		if (row !== 3) {
			pop(verdict, start)
			return
		}
		// The rejected file: undone now, pending again once the agent revises.
		track(verdict, [
			[0, { opacity: 0, transform: 'scale(0)' }],
			[start, { opacity: 1, transform: 'scale(0)' }, SPRING],
			[start + 0.4, { opacity: 1, transform: 'none' }],
			[14, { opacity: 1, transform: 'none' }],
			[14.25, { opacity: 0, transform: 'scale(.6)' }],
		])
	})
	const fill = $('.hs-fill')
	fill.style.transformOrigin = 'left center'
	fill.style.transformBox = 'fill-box'
	track(fill, [
		[0, { transform: 'scaleX(0)', opacity: 1 }],
		[9.4, { transform: 'scaleX(0)', opacity: 1 }],
		[10.75, { transform: 'scaleX(1)', opacity: 1 }],
		// The revised file is pending again: progress gives back one sixth.
		[14.1, { transform: 'scaleX(1)', opacity: 1 }],
		[14.5, { transform: 'scaleX(.8333)', opacity: 1 }],
		[FADE_START, { transform: 'scaleX(.8333)', opacity: 1 }],
		[FADE_END, { transform: 'scaleX(.8333)', opacity: 0 }],
	])
	// The count reads 6/6 only once every verdict is in.
	track($('.hs-progress-1'), [
		[0, { opacity: 0 }],
		[10.6, { opacity: 0 }],
		[10.8, { opacity: 1 }],
		[14.1, { opacity: 1 }],
		[14.25, { opacity: 0 }],
	])
	track($('.hs-progress-2'), [
		[0, { opacity: 0 }],
		[14.25, { opacity: 0 }],
		[14.45, { opacity: 1 }],
		[FADE_START, { opacity: 1 }],
		[FADE_END, { opacity: 0 }],
	])

	// 11.1 - 13.1  Send: the verdict goes back to the agent.
	track($('.hs-send-box'), [
		[0, { fill: COLOR.accent }],
		[11.12, { fill: COLOR.accent }],
		[11.22, { fill: COLOR.accentDeep }],
		[11.6, { fill: COLOR.accent }],
	])
	// The button reads "Sent" while the agent works, then offers the next round.
	track($('.hs-send-label'), [
		[0, { opacity: 1 }],
		[11.28, { opacity: 1 }],
		[11.4, { opacity: 0 }],
		[14.2, { opacity: 0 }],
		[14.4, { opacity: 1 }],
	])
	track($('.hs-send-sent'), [
		[0, { opacity: 0 }],
		[11.4, { opacity: 0 }],
		[11.55, { opacity: 1 }],
		[14.05, { opacity: 1 }],
		[14.2, { opacity: 0 }],
	])
	travel($('.hs-signal-back'), 11.5, 1.6)

	// 13.1 - 14.4  The agent rewrites one file; it alone comes back pending.
	const rev = $('.hs-rev')
	rev.style.transformOrigin = 'center'
	pop(rev, 13.95)
	const pending = $('.hs-row-pending')
	pending.style.transformOrigin = 'center'
	pop(pending, 14.1)
	track($('.hs-round-1'), [
		[0, { opacity: 1 }],
		[14, { opacity: 1 }],
		[14.15, { opacity: 0 }],
		[FADE_START, { opacity: 0 }],
		[FADE_END, { opacity: 1 }],
	])
	track($('.hs-round-2'), [
		[0, { opacity: 0 }],
		[14.15, { opacity: 0 }],
		[14.35, { opacity: 1 }],
		[FADE_START, { opacity: 1 }],
		[FADE_END, { opacity: 0 }],
	])
}

// Depth on pointer: the three columns drift a few pixels apart, and the
// field's registration crosses light up around the cursor.
function bindPointer() {
	const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
	if (!fine.matches) return
	const layers = [
		[svg.querySelector('.hs-agent'), 5],
		[svg.querySelector('.hs-desk'), 9],
		[svg.querySelector('.hs-ledger'), 13],
	]
	let frame = 0
	hero.addEventListener('pointermove', event => {
		cancelAnimationFrame(frame)
		frame = requestAnimationFrame(() => {
			if (reducedMotion.matches) return
			const box = hero.getBoundingClientRect()
			const x = event.clientX - box.left
			const y = event.clientY - box.top
			hero.style.setProperty('--mx', `${x}px`)
			hero.style.setProperty('--my', `${y}px`)
			hero.classList.add('is-lit')
			const dx = x / box.width - 0.5
			const dy = y / box.height - 0.5
			layers.forEach(([layer, depth]) => {
				layer.style.translate = `${(dx * depth).toFixed(2)}px ${(dy * depth * 0.6).toFixed(2)}px`
			})
		})
	})
	hero.addEventListener('pointerleave', () => {
		hero.classList.remove('is-lit')
		layers.forEach(([layer]) => {
			layer.style.translate = '0 0'
		})
	})
}

let running = false
function start() {
	if (running) return
	running = true
	choreograph()
}
function stop() {
	if (!running) return
	running = false
	// The SVG markup is the static pose, so cancelling lands every element there.
	svg.getAnimations({ subtree: true }).forEach(animation => animation.cancel())
}

// The preference is read live, not just at boot: switching to reduce cancels the
// running WAAPI timeline; switching back restarts it from the top.
reducedMotion.addEventListener('change', () => {
	if (reducedMotion.matches) stop()
	else start()
})

if (svg) {
	if (!reducedMotion.matches) start()
	bindPointer()
}
