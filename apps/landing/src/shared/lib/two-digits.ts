const DIGITS = 2

export const twoDigits = (step: number): string =>
	String(step).padStart(DIGITS, '0')
