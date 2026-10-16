import type { ReviewFile } from '../model'

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
