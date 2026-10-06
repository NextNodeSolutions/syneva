import type { ModeKey } from './display'

// What each kind of review is called in the filter: the words of the command that opens it.
export const MODE_NAMES: Record<ModeKey, string> = {
	working: 'Working tree',
	staged: 'Staged',
	file: 'File',
	pr: 'Pull request',
}
