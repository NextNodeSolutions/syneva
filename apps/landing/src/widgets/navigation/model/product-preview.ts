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
		this.#place(link)
		this.#links.forEach(candidate =>
			candidate.classList.toggle('is-previewed', candidate === link),
		)
		this.#scenes.forEach(scene =>
			scene.classList.toggle(
				'is-current',
				scene.dataset.scene === link.dataset.preview,
			),
		)
	}

	// The rows moved with the layout: place the selection on them again.
	reposition(): void {
		if (this.#selected) this.#place(this.#selected)
	}

	#place(link: HTMLElement): void {
		this.#morph.preview(
			this.#scenes.find(
				scene => scene.dataset.scene === link.dataset.preview,
			),
			link,
		)
	}
}
