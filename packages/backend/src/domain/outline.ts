// The shape of a source file as the review needs it: its top-level declarations (what a changed block belongs to), its imports (how its code reaches other files) and what each line holds. Parsing lives in an adapter; everything here is pure over that outline.

export type SymbolKind =
	| 'function'
	| 'class'
	| 'method'
	| 'interface'
	| 'type'
	| 'enum'
	| 'variable'
	| 'call'
	| 'section'

export type OutlineDeclaration = {
	// Qualified within the file: `Hub.open` for a class member, `describe("guide")` for a top-level call, the heading text for a Markdown section.
	readonly name: string
	readonly kind: SymbolKind
	readonly startLine: number
	readonly endLine: number
	readonly isExported: boolean
	// The identifiers the declaration's body references: how its code reaches the file's other declarations and its imports.
	readonly uses: readonly string[]
}

export type OutlineImport = {
	readonly local: string
	// The exported name it binds ("default" for a default import, "*" for a namespace).
	readonly imported: string
	readonly source: string
}

// One character per line, line N at index N-1: blank, comment only, part of an import, or code.
export type LineKind = 'b' | 'c' | 'i' | 'x'

export type SourceOutline = {
	readonly declarations: readonly OutlineDeclaration[]
	readonly imports: readonly OutlineImport[]
	readonly lineKinds: string
}

// What a changed block is when it touches no code: only comments (with blank lines), or only import statements.
export type ChangeTrivia = 'comment' | 'import'

export type ChangeSymbol = { readonly name: string; readonly kind: SymbolKind }

export type OutlineLanguage = 'script' | 'markdown'

const SCRIPT_EXTENSIONS = new Set([
	'ts',
	'tsx',
	'mts',
	'cts',
	'js',
	'jsx',
	'mjs',
	'cjs',
])
const MARKDOWN_EXTENSIONS = new Set(['md', 'mdx', 'markdown'])

// The languages an outline exists for; every other file keeps its blocks unnamed.
export function outlineLanguage(path: string): OutlineLanguage | null {
	const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
	if (SCRIPT_EXTENSIONS.has(extension)) return 'script'
	if (MARKDOWN_EXTENSIONS.has(extension)) return 'markdown'
	return null
}

export type LineSpan = { lineNumber: number; endLine: number }

function lineCount(declaration: OutlineDeclaration): number {
	return declaration.endLine - declaration.startLine
}

function overlaps(declaration: OutlineDeclaration, span: LineSpan): boolean {
	return (
		declaration.startLine <= span.endLine &&
		span.lineNumber <= declaration.endLine
	)
}

function encloses(
	outer: OutlineDeclaration,
	inner: OutlineDeclaration,
): boolean {
	return (
		outer.startLine <= inner.startLine &&
		inner.endLine <= outer.endLine &&
		lineCount(inner) < lineCount(outer)
	)
}

// The block's lines inside the declaration.
function coverage(declaration: OutlineDeclaration, span: LineSpan): number {
	return (
		Math.min(declaration.endLine, span.endLine) -
		Math.max(declaration.startLine, span.lineNumber)
	)
}

// The declarations a block changes, the one it is named by first. A block inside one declaration belongs to the narrowest that holds it (a method over its class, a subsection over its section). A block across several (a deleted file, a new function written over the tail of the one before) changes each outermost one it reaches, named by the one it covers most - an exported one first on a tie, then the earliest.
export function blockDeclarations(
	outline: SourceOutline,
	span: LineSpan,
): OutlineDeclaration[] {
	const reached = outline.declarations.filter(declaration =>
		overlaps(declaration, span),
	)
	const [holder] = reached
		.filter(
			declaration =>
				declaration.startLine <= span.lineNumber &&
				span.endLine <= declaration.endLine,
		)
		.toSorted((a, b) => lineCount(a) - lineCount(b))
	if (holder) return [holder]
	return reached
		.filter(inner => !reached.some(outer => encloses(outer, inner)))
		.toSorted(
			(a, b) =>
				coverage(b, span) - coverage(a, span) ||
				Number(b.isExported) - Number(a.isExported) ||
				a.startLine - b.startLine,
		)
}

// Only blank and comment lines → "comment"; blank, comment and import lines with an import among them → "import"; any code line → neither.
export function changeTrivia(
	outline: SourceOutline,
	span: LineSpan,
): ChangeTrivia | undefined {
	const kinds = new Set(
		outline.lineKinds.slice(span.lineNumber - 1, span.endLine),
	)
	if (!kinds.size || kinds.has('x')) return undefined
	if (kinds.has('i')) return 'import'
	if (kinds.has('c')) return 'comment'
	return undefined
}
