const FNV_OFFSET_BASIS = 0x81_1c_9d_c5
const FNV_PRIME = 0x01_00_01_93
const KEY_RADIX = 36

export function fingerprint(text: string): string {
	let hash = FNV_OFFSET_BASIS
	for (let index = 0; index < text.length; index++) {
		hash ^= text.charCodeAt(index)
		hash = Math.imul(hash, FNV_PRIME)
	}
	return `${text.length.toString(KEY_RADIX)}.${(hash >>> 0).toString(KEY_RADIX)}`
}
