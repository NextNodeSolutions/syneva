// Step and count labels read as two digits (01, 02, ... 14).
const DIGITS = 2

export const twoDigits = (step: number): string =>
	String(step).padStart(DIGITS, '0')
