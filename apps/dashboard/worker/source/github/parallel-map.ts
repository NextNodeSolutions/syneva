const CONCURRENCY = 4

export function parallelMap<Input, Output>(
	items: readonly Input[],
	run: (item: Input) => Promise<Output>,
): Promise<Output[]> {
	const batches = Array.from(
		{ length: Math.ceil(items.length / CONCURRENCY) },
		(_, index) =>
			items.slice(index * CONCURRENCY, (index + 1) * CONCURRENCY),
	)
	return batches.reduce<Promise<Output[]>>(async (previous, batch) => {
		const completed = await previous
		return [...completed, ...(await Promise.all(batch.map(run)))]
	}, Promise.resolve([]))
}
