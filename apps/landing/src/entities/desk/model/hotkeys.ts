// The desk's key bindings, written the way its own keyboard map writes them
// (packages/frontend/src/app/hotkeys-*.ts): ⇧ for Shift, ⌘ for Command.
export const HOTKEYS = {
	nextChange: 'j',
	previousChange: 'k',
	keep: '⇧Y',
	undo: '⇧N',
	approveFile: '⇧A',
	commentOnLine: 'c',
	commentOnFile: '⇧C',
	ask: '⌘⇧↵',
	nextFile: '⇧→',
	switchView: 'w',
	reviewNotes: 'n',
	hideApproved: '⇧H',
	openEditor: '⇧E',
	send: '⇧S',
	keyboardMap: '?',
} as const
