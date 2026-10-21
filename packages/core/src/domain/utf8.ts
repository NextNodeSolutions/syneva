// UTF-8 widths by UTF-16 code unit: below 0x80 one byte, below 0x800 two, a surrogate pair four
// (one code point), any other unit three - a lone surrogate included, since an encoder writes it
// as U+FFFD.
const ONE_BYTE_BELOW = 0x80
const TWO_BYTES_BELOW = 0x800
const HIGH_SURROGATE_FIRST = 0xd800
const HIGH_SURROGATE_LAST = 0xdbff
const LOW_SURROGATE_FIRST = 0xdc00
const LOW_SURROGATE_LAST = 0xdfff
const PAIR_BYTES = 4
const PAIR_UNITS = 2
const WIDE_BYTES = 3
const NARROW_BYTES = 2

// The byte size of a text as UTF-8, counted without encoding it: the same count as Node's
// Buffer.byteLength(text, 'utf8') and TextEncoder, in pure code, so the diff assembly sizes
// files and diff lines the same way on Node and on Workers without allocating a copy per line.
export function utf8ByteLength(text: string): number {
	let bytes = 0
	let index = 0
	while (index < text.length) {
		const unit = text.charCodeAt(index)
		if (isSurrogatePair(unit, text.charCodeAt(index + 1))) {
			bytes += PAIR_BYTES
			index += PAIR_UNITS
			continue
		}
		bytes += unitBytes(unit)
		index += 1
	}
	return bytes
}

function unitBytes(unit: number): number {
	if (unit < ONE_BYTE_BELOW) return 1
	if (unit < TWO_BYTES_BELOW) return NARROW_BYTES
	return WIDE_BYTES
}

// charCodeAt past the end is NaN, which no range admits.
function isSurrogatePair(unit: number, next: number): boolean {
	return (
		unit >= HIGH_SURROGATE_FIRST &&
		unit <= HIGH_SURROGATE_LAST &&
		next >= LOW_SURROGATE_FIRST &&
		next <= LOW_SURROGATE_LAST
	)
}
