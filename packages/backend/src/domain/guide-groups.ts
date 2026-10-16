// The candidate domains while the partition shapes them: each group's blocks, file operations and paths, and the group every graph node sits in (a node's blocks always move together).
export type Group = {
	readonly units: Set<string>
	readonly files: Set<string>
	readonly paths: Set<string>
}

export type GroupSet = {
	readonly groups: Map<string, Group>
	readonly nodeGroup: Map<string, string>
}

export type GroupEntry = {
	readonly node?: string | undefined
	readonly path: string
} & ({ readonly unit: string } | { readonly file: string })

export function emptyGroupSet(): GroupSet {
	return { groups: new Map(), nodeGroup: new Map() }
}

export function groupSize(group: Group): number {
	return group.units.size + group.files.size
}

export function addToGroup(
	set: GroupSet,
	label: string,
	entry: GroupEntry,
): void {
	const group = set.groups.get(label) ?? {
		units: new Set<string>(),
		files: new Set<string>(),
		paths: new Set<string>(),
	}
	set.groups.set(label, group)
	if ('unit' in entry) group.units.add(entry.unit)
	else group.files.add(entry.file)
	group.paths.add(entry.path)
	if (entry.node) set.nodeGroup.set(entry.node, label)
}

export function mergeGroups(set: GroupSet, from: string, into: string): void {
	const source = set.groups.get(from)
	const target = set.groups.get(into)
	if (!source || !target || from === into) return
	for (const key of source.units) target.units.add(key)
	for (const file of source.files) target.files.add(file)
	for (const filePath of source.paths) target.paths.add(filePath)
	set.groups.delete(from)
	for (const [node, label] of set.nodeGroup)
		if (label === from) set.nodeGroup.set(node, into)
}
