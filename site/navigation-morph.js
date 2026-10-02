import { measureNavigation } from './navigation-geometry.js'

const geometryProperties = ['x', 'y', 'width', 'height', 'reveal', 'indicator-x', 'indicator-width', 'selection-y', 'selection-height']
const contentProperties = ['progress', 'offset', 'opacity']
const contentExitProgress = 0.22
const contentEnterProgress = 0.7

// Registered <number> channels are what let WAAPI interpolate the morph. Without
// CSS.registerProperty the values still carry (var() aliases and custom-property
// inheritance work unregistered), but every move degrades to an instant jump.
const canInterpolate = typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function'

function registerChannel(element, prefix, properties) {
	return Object.fromEntries(properties.map(property => {
		const name = `--nav-${prefix}${property}`
		if (canInterpolate) CSS.registerProperty({ name, syntax: '<number>', inherits: true, initialValue: '0' })
		element.style.setProperty(`--${property}`, `var(${name})`)
		return [property, name]
	}))
}

function channelValues(channel, values) {
	return Object.fromEntries(Object.entries(values).map(([key, value]) => [channel[key], String(value)]))
}

// Menu geometry and content share a clock; preview hovers cannot restart it.
// Each clock samples its rendered pose before retargeting.
export class NavigationMorph {
	#navigation
	#panels
	#scenes
	#compact
	#shell
	#panelChannels
	#sceneChannels
	#reduced = matchMedia('(prefers-reduced-motion: reduce)')
	#motions = { menu: { target: {} }, preview: { target: {} } }
	#folded

	constructor(navigation, panels, scenes, compact) {
		this.#navigation = navigation
		this.#panels = panels
		this.#scenes = scenes
		this.#compact = compact
		this.#shell = registerChannel(navigation, '', geometryProperties)
		this.#panelChannels = panels.map((panel, index) => registerChannel(panel, `panel-${index}-`, contentProperties))
		this.#sceneChannels = scenes.map((scene, index) => registerChannel(scene, `scene-${index}-`, contentProperties))
		this.#reduced.addEventListener('change', () => {
			if (this.#reduced.matches) this.finish()
		})
	}

	#animateTo(clock, next, seeds = {}) {
		const motion = this.#motions[clock]
		if (Object.entries(next).every(([key, value]) => motion.target[key] === value)) return
		const styles = getComputedStyle(this.#navigation)
		const destination = { ...motion.target, ...next }
		const origin = Object.fromEntries(Object.keys(destination).map(key => [key, styles.getPropertyValue(key).trim()]))
		const timing = next[this.#shell.reveal] === '0' ? 'close' : clock
		const duration = parseFloat(styles.getPropertyValue(`--nav-${timing}-duration`))
		const easing = styles.getPropertyValue('--nav-ease').trim()
		const isInstant = this.#reduced.matches || this.#navigation.dataset.input === 'keyboard' || !canInterpolate
		const frames = this.#contentFrames({ ...origin, ...seeds }, destination)
		motion.animation?.cancel()
		motion.target = destination
		Object.entries(destination).forEach(([key, value]) => this.#navigation.style.setProperty(key, value))
		if (isInstant) {
			if (clock === 'preview') this.#settleScenes()
			return
		}
		const animation = this.#navigation.animate(frames, { duration, easing })
		motion.animation = animation
		if (clock === 'preview') animation.onfinish = () => {
			if (motion.animation === animation) this.#settleScenes()
		}
	}

	#contentFrames(origin, destination) {
		const departure = { offset: contentExitProgress }
		const arrival = { offset: contentEnterProgress }
		for (const channels of [this.#panelChannels, this.#sceneChannels]) {
			const incoming = channels.find(channel => destination[channel.progress] === '1')
			if (!incoming) continue
			const outgoing = channels.filter(channel => channel !== incoming && Number(origin[channel.opacity]) > 0)
			if (!outgoing.length) continue
			// Readable content hands over instead of superimposing two menus.
			outgoing.forEach(channel => { departure[channel.opacity] = '0' })
			departure[incoming.opacity] = origin[incoming.opacity]
			arrival[incoming.opacity] = destination[incoming.opacity]
		}
		return [{ ...origin, offset: 0 }, departure, arrival, { ...destination, offset: 1 }]
	}

	#settleScenes() {
		this.#scenes.forEach((scene, index) => {
			if (this.#motions.preview.target[this.#sceneChannels[index].progress] === '0') scene.classList.remove('is-illustrating')
		})
	}

	#revealChannels(clock, selected, travel) {
		const channels = clock === 'menu' ? this.#panelChannels : this.#sceneChannels
		const previous = channels.findIndex(channel => this.#motions[clock].target[channel.progress] === '1')
		const direction = selected < previous ? -1 : 1
		const styles = getComputedStyle(this.#navigation)
		const next = {}
		const seeds = {}
		channels.forEach((channel, index) => {
			Object.assign(next, channelValues(channel, { progress: index === selected ? 1 : 0, opacity: index === selected ? 1 : 0, offset: index === selected ? 0 : -direction * travel }))
			if (index === selected && Number(styles.getPropertyValue(channel.progress)) === 0) seeds[channel.offset] = String(direction * travel)
		})
		return { next, seeds }
	}

	position(trigger, panel) {
		const geometry = measureNavigation(this.#navigation, trigger, panel, this.#compact)
		if (!geometry) return
		this.#folded = geometry.folded
		const styles = getComputedStyle(this.#navigation)
		const travel = parseFloat(styles.getPropertyValue('--nav-panel-travel'))
		const content = this.#revealChannels('menu', this.#panels.indexOf(panel), travel)
		const next = { ...channelValues(this.#shell, { ...geometry.open, reveal: 1 }), ...content.next }
		const isHidden = Number(styles.getPropertyValue(this.#shell.reveal)) === 0
		const seeds = isHidden ? { ...channelValues(this.#shell, this.#folded), ...content.seeds } : content.seeds
		this.#animateTo('menu', next, seeds)
	}

	close() {
		if (!this.#folded) return
		const content = Object.fromEntries(this.#panelChannels.flatMap(channel => [[channel.progress, '0'], [channel.opacity, '0']]))
		this.#animateTo('menu', { ...channelValues(this.#shell, { ...this.#folded, reveal: 0 }), ...content })
	}

	preview(scene, link) {
		// Keep an outgoing illustration alive until its shared fade completes.
		scene.classList.add('is-illustrating')
		const travel = parseFloat(getComputedStyle(this.#navigation).getPropertyValue('--nav-preview-travel'))
		const content = this.#revealChannels('preview', this.#scenes.indexOf(scene), travel)
		const selection = channelValues(this.#shell, { 'selection-y': link.offsetTop, 'selection-height': link.offsetHeight })
		this.#animateTo('preview', { ...content.next, ...selection }, content.seeds)
	}

	finish() {
		Object.values(this.#motions).forEach(motion => motion.animation?.cancel())
		this.#settleScenes()
	}
}
