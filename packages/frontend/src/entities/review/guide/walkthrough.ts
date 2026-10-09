import type { FileReviewState, ReviewFile } from '../model'
import type { GuideFileEntry } from './domains'

export type LineStat = { added: number; removed: number }
type FileLike = Pick<
	ReviewFile,
	'path' | 'added' | 'removed' | 'oldPath' | 'newPath' | 'renamePure'
>

export function lineStats(files: FileLike[]): Map<string, LineStat> {
	return new Map(
		files.map(file => [
			file.path,
			{ added: file.added, removed: file.removed },
		]),
	)
}

export type WalkFile = {
	path: string
	dir: string
	name: string
	fileIndex: number
	movedFrom: string
	added: number
	removed: number
	state: FileReviewState
}

export type WalkGroup = {
	category: string
	// The owning domain's stable id: two domains with one title stay two sections, and a file they both own keeps a row under each.
	domainId?: string | undefined
	other: boolean
	renamed: boolean
	// Exclusive with renamed by construction: a pure rename has no blocks, so it can never be approved.
	reviewed?: boolean
	files: WalkFile[]
	added: number
	removed: number
	done: number
	total: number
}

type GroupFlags = {
	isOther: boolean
	isRenamed?: boolean
	isReviewed?: boolean
}

function blankGroup(
	category: string,
	flags: GroupFlags,
	domainId?: string,
): WalkGroup {
	return {
		category,
		domainId,
		other: flags.isOther,
		renamed: flags.isRenamed ?? false,
		reviewed: flags.isReviewed ?? false,
		files: [],
		added: 0,
		removed: 0,
		done: 0,
		total: 0,
	}
}

// Pure accumulator: groups are replaced, never mutated in place, so call sites hold them in const/let bindings without reassigning a parameter's properties.
function withFile(group: WalkGroup, f: WalkFile): WalkGroup {
	return {
		...group,
		files: [...group.files, f],
		added: group.added + f.added,
		removed: group.removed + f.removed,
		total: group.total + 1,
		done: group.done + (f.state === 'pending' ? 0 : 1),
	}
}

function categoryKey(index: number, group: WalkGroup): string {
	if (group.renamed) return `cat:${index}:·renamed`
	if (group.reviewed) return `cat:${index}:·reviewed`
	if (group.other) return `cat:${index}:·other`
	return `cat:${index}:${group.domainId ?? group.category}`
}

function fileBuilder(
	files: FileLike[],
	stats: Map<string, LineStat>,
	stateOf: (path: string) => FileReviewState,
): (path: string, fileIndex: number) => WalkFile {
	return (path, fileIndex): WalkFile => {
		const name = path.split('/').pop() ?? path
		const stat = stats.get(path) ?? { added: 0, removed: 0 }
		const file = files[fileIndex]
		const moved =
			file?.oldPath && file.newPath && file.oldPath !== file.newPath
				? file.oldPath
				: ''
		return {
			path,
			dir: path.slice(0, path.length - name.length),
			name,
			fileIndex,
			movedFrom: moved,
			added: stat.added,
			removed: stat.removed,
			state: stateOf(path),
		}
	}
}

// Run-length grouping: a new section starts whenever the category changes from the previous shown
// file, so a non-contiguous category yields separate sections and these surfaces mirror guideOrder()
// exactly; diff files absent from the guide land in a trailing "Other" group (the progress strip's
// count always covers); the router sends pure renames first, then the hide-reviewed lens' approved
// files, and hands a file back when it stays shown.
function foldBuckets(
	isRenamed: (path: string) => boolean,
	isDistilled: (path: string) => boolean,
): {
	renamed: WalkGroup
	reviewed: WalkGroup
	route: (path: string, file: WalkFile) => WalkFile | null
} {
	const renamed = blankGroup('Renamed', { isOther: false, isRenamed: true })
	const reviewed = blankGroup('Reviewed', {
		isOther: false,
		isReviewed: true,
	})
	const route = (path: string, file: WalkFile): WalkFile | null => {
		let bucket: WalkGroup | null = null
		if (isRenamed(path)) bucket = renamed
		else if (isDistilled(path)) bucket = reviewed
		if (!bucket) return file
		bucket.files.push(file)
		bucket.added += file.added
		bucket.removed += file.removed
		bucket.total++
		bucket.done += file.state === 'pending' ? 0 : 1
		return null
	}
	return { renamed, reviewed, route }
}

export function walkthroughGroups(
	guideFiles: GuideFileEntry[],
	files: FileLike[],
	stateOf: (path: string) => FileReviewState,
	folds: {
		renamed: (path: string) => boolean
		distilled: (path: string) => boolean
	} = {
		renamed: (): boolean => false,
		distilled: (): boolean => false,
	},
): WalkGroup[] {
	const stats = lineStats(files)
	const index = new Map(files.map((f, i) => [f.path, i] as const))
	const mkFile = fileBuilder(files, stats, stateOf)
	const groups: WalkGroup[] = []
	const listed = new Set<string>()
	const buckets = foldBuckets(folds.renamed, folds.distilled)
	const { route } = buckets
	let current: WalkGroup | null = null
	for (const guide of guideFiles) {
		listed.add(guide.path)
		const i = index.get(guide.path)
		if (typeof i !== 'number') continue
		const file = mkFile(guide.path, i)
		const shown = route(guide.path, file)
		if (!shown) continue
		if (!current || current.domainId !== guide.domainId) {
			current = blankGroup(
				guide.category,
				{ isOther: false },
				guide.domainId,
			)
			groups.push(current)
		}
		current = withFile(current, shown)
		groups[groups.length - 1] = current
	}
	let otherGroup = blankGroup('Other', { isOther: true })
	files.forEach((file, i): void => {
		if (listed.has(file.path)) return
		const shown = route(file.path, mkFile(file.path, i))
		if (!shown) return
		otherGroup = withFile(otherGroup, shown)
	})
	if (otherGroup.total) groups.push(otherGroup)
	if (buckets.renamed.total) groups.push(buckets.renamed)
	if (buckets.reviewed.total) groups.push(buckets.reviewed)
	return groups
}

export type ExpandedGroups = { renamed?: boolean; reviewed?: boolean }
export type WalkRow =
	| {
			kind: 'cat'
			key: string
			category: string
			other: boolean
			renamed: boolean
			reviewed: boolean
			open: boolean
			total: number
			done: number
			added: number
			removed: number
			complete: boolean
			jumpIndex: number
	  }
	| (WalkFile & { kind: 'file'; key: string; active: boolean })

function isCollapsed(group: WalkGroup, expanded: ExpandedGroups): boolean {
	if (group.renamed) return !expanded.renamed
	if (group.reviewed) return !expanded.reviewed
	return false
}

export function walkRows(
	groups: WalkGroup[],
	activePath: string | null,
	expanded: ExpandedGroups = {},
): WalkRow[] {
	const rows: WalkRow[] = []
	groups.forEach((group, gi): void => {
		const target =
			group.files.find(f => f.state === 'pending') ?? group.files[0]
		if (!target) return
		const collapsed = isCollapsed(group, expanded)
		rows.push({
			kind: 'cat',
			key: categoryKey(gi, group),
			category: group.category,
			other: group.other,
			renamed: group.renamed,
			reviewed: group.reviewed ?? false,
			open: !collapsed,
			total: group.total,
			done: group.done,
			added: group.added,
			removed: group.removed,
			complete: group.done === group.total,
			jumpIndex: target.fileIndex,
		})
		if (collapsed) return
		for (const f of group.files)
			rows.push({
				...f,
				kind: 'file',
				key: `file:${group.domainId ?? categoryKey(gi, group)}:${f.path}`,
				active: f.path === activePath,
			})
	})
	return rows
}
