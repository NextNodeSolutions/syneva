export type Settings = {
	lineDiffType: 'word-alt' | 'word' | 'char' | 'none'
	diffIndicators: 'bars' | 'classic' | 'none'
	hunkSeparators: 'line-info' | 'simple' | 'metadata' | 'line-info-basic'
	overflow: 'scroll' | 'wrap'
	lineHighlight: 'full' | 'subtle' | 'off'
	appearance: 'dark' | 'light'
	theme: string
	font: string
	uiFont: string
	fontSize: number
	tabSize: number
	showUnchanged: boolean
	unchangedLines: 'collapse' | 'expand'
	progressBy: 'lines' | 'files'
	sidebarDefault: 'tree' | 'walkthrough'
	markdownView: 'auto' | 'rendered' | 'source'
	hideReviewed: boolean
	stageOnAccept: boolean
	editorCommand: string
}
