// steps() as keyframes: each step holds until the next starts, a duplicate offset makes the jump instantaneous - exact, not a sampled linear() approximation.
export type Stepped = { values: string[]; times: number[] }

export function steps(
	count: number,
	at: (progress: number) => string,
): Stepped {
	const values: string[] = []
	const times: number[] = []
	for (let step = 0; step < count; step += 1) {
		values.push(at(step / count), at(step / count))
		times.push(step / count, (step + 1) / count)
	}
	values.push(at(1))
	times.push(1)
	return { values, times }
}
