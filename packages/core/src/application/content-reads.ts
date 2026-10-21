// Every content read holds a file descriptor and one build can touch thousands: an unbounded Promise.all exhausts the budget (macOS defaults to 256, constrained shells lower) and, since a missing side deliberately degrades to "", the review would silently come out wrong.
// Four in flight keeps the reads warm without holding many handles.
export const CONTENT_READ_LIMIT = 4

// Map `read` over `items`, keeping at most CONTENT_READ_LIMIT reads in flight; results keep the input order.
export async function mapContentReads<Item, Mapped>(
	items: readonly Item[],
	read: (entry: Item, index: number) => Promise<Mapped>,
): Promise<Mapped[]> {
	const results: Mapped[] = []
	let next = 0
	const worker = async (): Promise<void> => {
		const index = next
		if (index >= items.length) return
		next++
		// The bounds check above makes items[index] real; the guard keeps the read honest for the compiler without changing behavior.
		const entry = items[index]
		if (!entry) return
		results[index] = await read(entry, index)
		return worker()
	}
	await Promise.all(
		Array.from(
			{ length: Math.min(CONTENT_READ_LIMIT, items.length) },
			worker,
		),
	)
	return results
}
