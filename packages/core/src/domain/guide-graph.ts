// The changeset as a weighted graph for the partition: one node per changed declaration (`path#Name`) and one per file for the code no declaration holds (`path#`), linked by what references what (symbol-links.ts), by sitting next to each other in a file, by being companion files (x.styles.ts beside x.tsx) and, weakest, by sharing a folder.
import path from 'node:path'

import { symbolNode } from './symbol-links.js'

import type { WeightedEdge } from './guide-louvain.js'

export type PartitionUnit = {
	readonly key: string
	readonly path: string
	readonly lineNumber: number
	readonly symbol?: string | undefined
	readonly links?: readonly string[] | undefined
}

export type ChangeGraph = {
	readonly nodes: readonly string[]
	readonly edges: readonly WeightedEdge[]
}

const SAME_FILE_LINK = 2
const CROSS_FILE_LINK = 1
const COMPANION_LINK = 2
const NEIGHBOUR_LINK = 0.5
const FOLDER_LINK = 0.25

// The node a unit stands for: its declaration, or its file when no declaration holds it.
export function unitNode(unit: Pick<PartitionUnit, 'path' | 'symbol'>): string {
	return symbolNode(unit.path, unit.symbol ?? '')
}

// `widgets/x/file-header` for file-header.ts, file-header.styles.ts and file-header.test.ts alike.
export function companionStem(filePath: string): string {
	const base = path.posix.basename(filePath)
	const dot = base.indexOf('.')
	const name = dot < 0 ? base : base.slice(0, dot)
	return path.posix.join(path.posix.dirname(filePath), name)
}

type Site = { readonly path: string; readonly line: number }
type Pair = readonly [string, string, number]

// Where each node first appears: its file and its first changed line (a file operation's node sits before any line).
function sitesOf(
	units: readonly PartitionUnit[],
	filePaths: readonly string[],
): Map<string, Site> {
	const sites = new Map<string, Site>()
	const placed = [
		...filePaths.map(filePath => ({ filePath, symbol: '', line: 0 })),
		...units.map(unit => ({
			filePath: unit.path,
			symbol: unit.symbol ?? '',
			line: unit.lineNumber,
		})),
	]
	for (const { filePath, symbol, line } of placed) {
		const node = symbolNode(filePath, symbol)
		const seen = sites.get(node)
		if (!seen || line < seen.line) sites.set(node, { path: filePath, line })
	}
	return sites
}

function grouped<T>(
	entries: readonly T[],
	keyOf: (entry: T) => string,
): Map<string, T[]> {
	const groups = new Map<string, T[]>()
	for (const entry of entries)
		groups.set(keyOf(entry), [...(groups.get(keyOf(entry)) ?? []), entry])
	return groups
}

// Each run's members tied in sequence (a file's nodes in line order, a folder's files in path order).
function chained(runs: Iterable<readonly string[]>, weight: number): Pair[] {
	return [...runs].flatMap(run =>
		run
			.slice(1)
			.map((node, position): Pair => [
				run[position] ?? node,
				node,
				weight,
			]),
	)
}

// Each run's members tied to its first (the files of one companion stem).
function starred(runs: Iterable<readonly string[]>, weight: number): Pair[] {
	return [...runs].flatMap(run =>
		run.slice(1).map((node): Pair => [run[0] ?? node, node, weight]),
	)
}

function linkPairs(units: readonly PartitionUnit[]): Pair[] {
	return units.flatMap(unit =>
		(unit.symbol ? (unit.links ?? []) : []).map((target): Pair => [
			unitNode(unit),
			target,
			target.startsWith(`${unit.path}#`)
				? SAME_FILE_LINK
				: CROSS_FILE_LINK,
		]),
	)
}

function placementPairs(sites: ReadonlyMap<string, Site>): Pair[] {
	const ordered = [...sites].toSorted(
		([a, left], [b, right]) => left.line - right.line || a.localeCompare(b),
	)
	const byFile = grouped(ordered, ([, site]) => site.path)
	const fileRuns = [...byFile.values()].map(run => run.map(([node]) => node))
	const heads = [...byFile]
		.map(([filePath, run]) => ({ filePath, head: run[0]?.[0] ?? '' }))
		.toSorted((a, b) => a.filePath.localeCompare(b.filePath))
	const runsBy = (keyOf: (filePath: string) => string): string[][] =>
		[...grouped(heads, entry => keyOf(entry.filePath)).values()].map(run =>
			run.map(entry => entry.head),
		)
	return [
		...chained(fileRuns, NEIGHBOUR_LINK),
		...starred(runsBy(companionStem), COMPANION_LINK),
		...chained(
			runsBy(filePath => path.posix.dirname(filePath)),
			FOLDER_LINK,
		),
	]
}

function pairKey(a: number, b: number): string {
	return a < b ? `${a},${b}` : `${b},${a}`
}

// Two nodes tied twice keep their strongest tie.
export function changeGraph(
	units: readonly PartitionUnit[],
	filePaths: readonly string[],
): ChangeGraph {
	const sites = sitesOf(units, filePaths)
	const nodes = [...sites.keys()].toSorted()
	const index = new Map(nodes.map((node, position) => [node, position]))
	const weights = new Map<string, { a: number; b: number; weight: number }>()
	for (const [from, to, weight] of [
		...linkPairs(units),
		...placementPairs(sites),
	]) {
		const a = index.get(from)
		const b = index.get(to)
		if (typeof a !== 'number' || typeof b !== 'number' || a === b) continue
		const seen = weights.get(pairKey(a, b))
		if (!seen || seen.weight < weight)
			weights.set(pairKey(a, b), { a, b, weight })
	}
	return { nodes, edges: [...weights.values()] }
}
