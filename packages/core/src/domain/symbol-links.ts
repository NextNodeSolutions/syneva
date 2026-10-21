// Which changed declarations a changed block's declaration references: the review's own call graph, read from names alone. A name used in the same file links to that file's changed declaration of the name; an imported name links to the changed declaration it imports, the module matched by its path (relative specifiers resolved, aliased or package specifiers matched by their trailing segments).
import path from 'node:path'

import type { OutlineImport } from './outline.js'

// One changed block: the declaration it is named by, every declaration it changes (one, or several for a block across them), what their bodies spell and what the file imports.
export type LinkSource = {
	readonly key: string
	readonly path: string
	readonly symbol: string
	readonly declared: readonly string[]
	readonly uses: readonly string[]
	readonly imports: readonly OutlineImport[]
}

// `path#Name` for a declaration, `path#Class.member` for a member: the node a partition groups.
export function symbolNode(filePath: string, symbol: string): string {
	return `${filePath}#${symbol}`
}

// A class member is reached through its class: a use of `Hub` links to `Hub` and every changed `Hub.*`.
function topName(symbol: string): string {
	const dot = symbol.indexOf('.')
	return dot < 0 ? symbol : symbol.slice(0, dot)
}

// The segments a package name takes: `@scope/name` or `name`.
const SCOPED_PACKAGE_SEGMENTS = 2
const PACKAGE_SEGMENTS = 1

const SCRIPT_EXTENSION = /\.(d\.)?[cm]?[jt]sx?$/

function stem(filePath: string): string {
	return filePath.replace(SCRIPT_EXTENSION, '').replace(/\/index$/, '')
}

// The changed files a specifier can name: a relative one resolved from the importer, any other by the segments after its package name (`@syneva/contracts/guide` → a file ending in `/guide`).
function moduleCandidates(
	from: string,
	specifier: string,
	stems: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
	if (specifier.startsWith('.')) {
		const target = stem(
			path.posix.normalize(
				path.posix.join(path.posix.dirname(from), specifier),
			),
		)
		return stems.get(target) ?? []
	}
	const segments = specifier.split('/')
	const packageSegments = specifier.startsWith('@')
		? SCOPED_PACKAGE_SEGMENTS
		: PACKAGE_SEGMENTS
	const rest = segments.slice(packageSegments).join('/')
	if (!rest) return []
	const suffix = `/${stem(rest)}`
	return [...stems.entries()]
		.filter(([fileStem]) => fileStem.endsWith(suffix))
		.flatMap(([, files]) => files)
}

type DeclarationIndex = Map<string, string[]>

function indexKey(filePath: string, name: string): string {
	return `${filePath}\0${name}`
}

function declarationIndex(sources: readonly LinkSource[]): DeclarationIndex {
	const index: DeclarationIndex = new Map()
	const entries = sources.flatMap(source =>
		source.declared.map(name => ({
			key: indexKey(source.path, topName(name)),
			node: symbolNode(source.path, source.symbol),
		})),
	)
	for (const { key, node } of entries) {
		const nodes = index.get(key) ?? []
		index.set(key, nodes.includes(node) ? nodes : [...nodes, node])
	}
	return index
}

function stemIndex(sources: readonly LinkSource[]): Map<string, string[]> {
	const stems = new Map<string, string[]>()
	for (const filePath of new Set(sources.map(source => source.path))) {
		const files = stems.get(stem(filePath)) ?? []
		stems.set(stem(filePath), [...files, filePath])
	}
	return stems
}

function linksOf(
	source: LinkSource,
	index: DeclarationIndex,
	stems: ReadonlyMap<string, readonly string[]>,
): string[] {
	const own = symbolNode(source.path, source.symbol)
	const imported = new Map(source.imports.map(entry => [entry.local, entry]))
	const targetsOf = (name: string): readonly string[] => {
		const entry = imported.get(name)
		if (!entry) return index.get(indexKey(source.path, name)) ?? []
		return moduleCandidates(source.path, entry.source, stems).flatMap(
			file => index.get(indexKey(file, entry.imported)) ?? [],
		)
	}
	const linked = new Set(source.uses.flatMap(targetsOf))
	linked.delete(own)
	return [...linked].toSorted()
}

// Per block key, the symbol nodes of the other changed declarations its declaration references.
export function symbolLinks(
	sources: readonly LinkSource[],
): Map<string, string[]> {
	const index = declarationIndex(sources)
	const stems = stemIndex(sources)
	return new Map(
		sources.map(source => [source.key, linksOf(source, index, stems)]),
	)
}
