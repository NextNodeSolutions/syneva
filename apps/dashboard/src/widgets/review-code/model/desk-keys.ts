export type DeskCommand = 'next_file' | 'previous_file' | 'switch_layout'

type DeskKey = {
	key: string
	isShifted: boolean
	command: DeskCommand
	description: string
}

// The one key map: the dispatcher and every hint read it, so a hint never drifts from what the key does.
export const DESK_KEYS: readonly DeskKey[] = [
	{
		key: 'ArrowRight',
		isShifted: true,
		command: 'next_file',
		description: 'Next file',
	},
	{
		key: 'ArrowLeft',
		isShifted: true,
		command: 'previous_file',
		description: 'Previous file',
	},
	{
		key: 'v',
		isShifted: false,
		command: 'switch_layout',
		description: 'Split / Stacked',
	},
]

const KEY_SYMBOLS: Readonly<Record<string, string>> = {
	ArrowRight: '→',
	ArrowLeft: '←',
}

type KeyPress = Pick<
	KeyboardEvent,
	'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey'
>

export function matchDeskKey(event: KeyPress): DeskCommand | null {
	if (event.metaKey || event.ctrlKey || event.altKey) return null
	const binding = DESK_KEYS.find(
		({ key, isShifted }) =>
			event.key === key && event.shiftKey === isShifted,
	)
	return binding?.command ?? null
}

export function keyHint(command: DeskCommand): string {
	const binding = DESK_KEYS.find(entry => entry.command === command)
	if (!binding) return ''
	const symbol = KEY_SYMBOLS[binding.key] ?? binding.key
	return `${binding.description} (${binding.isShifted ? '⇧' : ''}${symbol})`
}
