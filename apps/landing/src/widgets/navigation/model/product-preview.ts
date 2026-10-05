import type { NavigationMorph } from './navigation-morph'
import type { NavigationParts } from './navigation-parts'

// The product menu's preview: the hovered or focused row moves the shared
// selection background and puts its scene on stage, and the row and the
// scene are marked for the styles. The menu starts on its first row.
export class ProductPreview {
	readonly #links: HTMLElement[]
	readonly #scenes: HTMLElement[]
	readonly #morph: NavigationMorph
	#selected: HTMLElement | undefined

	constructor(
		{
			previewLinks,
			scenes,
		}: Pick<NavigationParts, 'previewLinks' | 'scenes'>,
		morph: NavigationMorph,
	) {
		this.#links = previewLinks
		this.#scenes = scenes
		this.#morph = morph
		const [first] = previewLinks
		if (first) this.select(first)
	}

	select(link: HTMLElement): void {
		this.#selected = link
		const scene = this.#sceneOf(link)
		this.#morph.preview(scene, link)
		this.#links.forEach(candidate =>
			candidate.classList.toggle('is-previewed', candidate === link),
		)
		this.#scenes.forEach(candidate =>
			candidate.classList.toggle('is-current', candidate === scene),
		)
	}

	// The rows moved with the layout: place the selection on them again.
	reposition(): void {
		if (this.#selected)
			this.#morph.preview(this.#sceneOf(this.#selected), this.#selected)
	}

	// A row previews the scene its data-preview names: a row naming none
	// would put nothing on stage.
	#sceneOf(link: HTMLElement): HTMLElement {
		const scene = this.#scenes.find(
			candidate => candidate.dataset.scene === link.dataset.preview,
		)
		if (!scene)
			throw new Error(
				`The product menu row "${link.textContent.trim()}" previews "${link.dataset.preview}", which names no [data-scene]: render a PreviewScene with that scene.`,
			)
		return scene
	}
}
