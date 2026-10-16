// The last shaping of the candidate domains: a group of a block or two joins the group it is most tied to, and past the cap the smallest group does the same. "Most tied" is the change graph's weight between the two groups, then the deepest folder they share, then the larger group.
import path from 'node:path'

import { groupSize, mergeGroups } from './guide-groups.js'

import type { ChangeGraph } from './guide-graph.js'
import type { Group, GroupSet } from './guide-groups.js'

const SMALL_GROUP = 2
// A small group with no tie joins another only when they share at least a top-level folder.
const MIN_SHARED_DEPTH = 1

type Candidate = { label: string; tie: number; depth: number; size: number }

// Groups that are what they are (the lockfiles, the documentation): never folded into code, never folded into.
export type Fixed = ReadonlySet<string>

function folders(group: Group): Set<string> {
	const prefixes = new Set<string>()
	for (const filePath of group.paths) {
		const segments = path.posix.dirname(filePath).split('/')
		segments.forEach((_, depth) =>
			prefixes.add(segments.slice(0, depth + 1).join('/')),
		)
	}
	prefixes.delete('.')
	return prefixes
}

function sharedDepth(own: ReadonlySet<string>, other: Group): number {
	return Math.max(
		0,
		...[...folders(other)]
			.filter(prefix => own.has(prefix))
			.map(prefix => prefix.split('/').length),
	)
}

function tiesOf(
	set: GroupSet,
	graph: ChangeGraph,
	label: string,
): Map<string, number> {
	const ties = new Map<string, number>()
	const groupOf = (node: number): string =>
		set.nodeGroup.get(graph.nodes[node] ?? '') ?? ''
	for (const { a, b, weight } of graph.edges) {
		const [from, to] = [groupOf(a), groupOf(b)]
		if (from === to || (from !== label && to !== label)) continue
		const other = from === label ? to : from
		ties.set(other, (ties.get(other) ?? 0) + weight)
	}
	return ties
}

export type Shaping = {
	readonly set: GroupSet
	readonly graph: ChangeGraph
	readonly fixed: Fixed
}

function candidates(
	{ set, graph, fixed }: Shaping,
	label: string,
): Candidate[] {
	const group = set.groups.get(label)
	if (!group || fixed.has(label)) return []
	const ties = tiesOf(set, graph, label)
	const own = folders(group)
	return [...set.groups]
		.filter(([other]) => other !== label && !fixed.has(other))
		.map(([other, candidate]) => ({
			label: other,
			tie: ties.get(other) ?? 0,
			depth: sharedDepth(own, candidate),
			size: groupSize(candidate),
		}))
		.toSorted(
			(a, b) =>
				b.tie - a.tie ||
				b.depth - a.depth ||
				b.size - a.size ||
				a.label.localeCompare(b.label),
		)
}

function smallestFirst({ set, fixed }: Shaping): string[] {
	return [...set.groups]
		.filter(([label]) => !fixed.has(label))
		.toSorted(
			([a, left], [b, right]) =>
				groupSize(left) - groupSize(right) || a.localeCompare(b),
		)
		.map(([label]) => label)
}

export function foldSmallGroups(shaping: Shaping): void {
	for (const label of smallestFirst(shaping)) {
		const group = shaping.set.groups.get(label)
		if (!group || groupSize(group) > SMALL_GROUP) continue
		const [host] = candidates(shaping, label)
		if (host && (host.tie > 0 || host.depth >= MIN_SHARED_DEPTH))
			mergeGroups(shaping.set, label, host.label)
	}
}

export function capGroups(shaping: Shaping, maxGroups: number): void {
	while (shaping.set.groups.size > maxGroups) {
		const [smallest] = smallestFirst(shaping)
		const [host] = smallest ? candidates(shaping, smallest) : []
		if (!smallest || !host) return
		mergeGroups(shaping.set, smallest, host.label)
	}
}
