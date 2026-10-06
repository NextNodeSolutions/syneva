// Pure and injected, so the pre-init window (no review yet) and an emptied review are unit-testable without the store - changes.ts is the store-reading wrapper.
export function pickCurrentFile<File>(
	files: readonly File[] | undefined,
	preview: File | null,
	fileIndex: number,
): File | null {
	return preview ?? files?.[fileIndex] ?? null
}
