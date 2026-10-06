import type { ReviewFile } from '../model'

export function movedFrom(files: ReviewFile[], path: string): string {
	const file = files.find(f => f.path === path)
	if (!file?.oldPath || !file.newPath || file.oldPath === file.newPath)
		return ''
	return file.oldPath
}

export function fileMovedPure(files: ReviewFile[], path: string): boolean {
	return !!files.find(f => f.path === path)?.renamePure
}

const RENAMED_GROUP_KEY = 'group:renamed'

export function isRenamedGroupExpanded(foldExpanded: Set<string>): boolean {
	return foldExpanded.has(RENAMED_GROUP_KEY)
}

export function toggleRenamedGroup(foldExpanded: Set<string>): void {
	if (foldExpanded.has(RENAMED_GROUP_KEY))
		foldExpanded.delete(RENAMED_GROUP_KEY)
	else foldExpanded.add(RENAMED_GROUP_KEY)
}
