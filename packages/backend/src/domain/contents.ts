export type FileContents = { oldContents: string; newContents: string }

// additions side = the new file, deletions side = the old file, from the on-demand contents (the state no longer embeds them); captured at creation, and re-anchoring matches against it after the agent's edits move things around.
export function anchorTextFor(
	contents: FileContents | undefined,
	side: 'additions' | 'deletions',
	lineNumber: number,
): string | undefined {
	const text =
		side === 'deletions' ? contents?.oldContents : contents?.newContents
	return text?.split('\n')[lineNumber - 1]
}
