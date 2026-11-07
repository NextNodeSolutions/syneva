const COUNT_WORDS = [
	'zero',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'ten',
] as const

export const countWord = (count: number): string =>
	COUNT_WORDS[count] ?? String(count)
