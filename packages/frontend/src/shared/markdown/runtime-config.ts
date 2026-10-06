export type MarkdownRuntime = {
	getTheme: () => string
	onLoaded: () => void
	onLoadError: () => void
	repoImageSrc: (src: string) => string
}

let runtime: MarkdownRuntime = {
	getTheme: () => '',
	onLoaded: () => {},
	onLoadError: () => {},
	repoImageSrc: src => src,
}

export function configureMarkdownRuntime(configured: MarkdownRuntime): void {
	runtime = configured
}

export function markdownRuntime(): MarkdownRuntime {
	return runtime
}
