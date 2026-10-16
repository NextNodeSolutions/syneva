// The changeset cut into candidate domains without a model: the change graph's communities (guide-graph.ts, guide-louvain.ts), the lockfiles set apart, the documentation read as one group, a crumb of a block or two folded into the group that holds its files, and past the cap the smallest group joined to the one it is most tied to.
import { isDocumentPath, isLockfilePath } from './changed-paths.js'
import { capGroups, foldSmallGroups } from './guide-fold.js'
import { changeGraph, unitNode } from './guide-graph.js'
import { addToGroup, emptyGroupSet, mergeGroups } from './guide-groups.js'
import { louvainCommunities } from './guide-louvain.js'
import { symbolNode } from './symbol-links.js'

import type { ChangeGraph, PartitionUnit } from './guide-graph.js'
import type { GroupSet } from './guide-groups.js'

// One candidate domain: the changed blocks (unit keys) and the hunk-less file operations it owns.
export type DraftGroup = { readonly units: string[]; readonly files: string[] }

// Modularity's own scale: above 1 the communities get smaller.
const RESOLUTION = 1
const LOCKFILE_GROUP = 'lockfiles'
const DOCUMENT_GROUP = 'docs'

function communityOf(graph: ChangeGraph): Map<string, string> {
	const membership = louvainCommunities(
		graph.nodes.length,
		graph.edges,
		RESOLUTION,
	)
	return new Map(
		graph.nodes.map((node, position) => [
			node,
			`c${membership[position] ?? position}`,
		]),
	)
}

function seeded(
	units: readonly PartitionUnit[],
	fileOps: readonly string[],
	graph: ChangeGraph,
): GroupSet {
	const set = emptyGroupSet()
	const community = communityOf(graph)
	for (const unit of units) {
		const node = unitNode(unit)
		const label = isLockfilePath(unit.path)
			? LOCKFILE_GROUP
			: (community.get(node) ?? node)
		addToGroup(set, label, { unit: unit.key, path: unit.path, node })
	}
	for (const file of fileOps) {
		const node = symbolNode(file, '')
		const label = isLockfilePath(file)
			? LOCKFILE_GROUP
			: (community.get(node) ?? node)
		addToGroup(set, label, { file, path: file, node })
	}
	return set
}

// Markdown sections reference nothing, so each document would stand alone: they read as one documentation group.
function gatherDocuments(set: GroupSet): void {
	const documents = [...set.groups].filter(([, group]) =>
		[...group.paths].every(filePath => isDocumentPath(filePath)),
	)
	const [first] = documents
	if (!first) return
	for (const [label] of documents.slice(1)) mergeGroups(set, label, first[0])
	const gathered = set.groups.get(first[0])
	if (!gathered) return
	set.groups.delete(first[0])
	set.groups.set(DOCUMENT_GROUP, gathered)
	for (const [node, label] of set.nodeGroup)
		if (label === first[0]) set.nodeGroup.set(node, DOCUMENT_GROUP)
}

function draftGroups(set: GroupSet): DraftGroup[] {
	return [...set.groups.values()]
		.map(group => ({ units: [...group.units], files: [...group.files] }))
		.toSorted(
			(a, b) =>
				b.units.length +
					b.files.length -
					(a.units.length + a.files.length) ||
				(a.units[0] ?? a.files[0] ?? '').localeCompare(
					b.units[0] ?? b.files[0] ?? '',
				),
		)
}

// About √n groups for n changed units and file operations - a reading list a reviewer can hold - and never more than `maxGroups`.
export function partitionChanges(
	units: readonly PartitionUnit[],
	fileOps: readonly string[],
	maxGroups: number,
): DraftGroup[] {
	const graph = changeGraph(
		units.filter(unit => !isLockfilePath(unit.path)),
		fileOps.filter(file => !isLockfilePath(file)),
	)
	const set = seeded(units, fileOps, graph)
	gatherDocuments(set)
	const shaping = {
		set,
		graph,
		fixed: new Set([LOCKFILE_GROUP, DOCUMENT_GROUP]),
	}
	foldSmallGroups(shaping)
	const readable = Math.round(Math.sqrt(units.length + fileOps.length))
	capGroups(shaping, Math.max(1, Math.min(maxGroups, readable)))
	return draftGroups(set)
}
