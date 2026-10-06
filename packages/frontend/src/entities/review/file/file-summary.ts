import type { ReviewFile } from '../model'

export function isMarkdownPath(path: string): boolean {
	return /\.(md|markdown|mdx)$/i.test(path)
}

// Pick the initial view before contents arrive: a parsed diff opens as source, a hunkless new/unchanged Markdown artifact opens rendered; the explicit preference wins (as its own narrow union, keeping the settings slice decoupled).
export function defaultFileView(
	file: Pick<ReviewFile, 'path' | 'hasHunks'>,
	preference: 'auto' | 'rendered' | 'source',
): 'rendered' | 'source' {
	if (!isMarkdownPath(file.path)) return 'source'
	if (preference !== 'auto') return preference
	return file.hasHunks ? 'source' : 'rendered'
}

export function reviewLineCount(
	file: Pick<ReviewFile, 'hasHunks' | 'added' | 'removed'>,
): number {
	return file.hasHunks ? file.added + file.removed : 0
}
