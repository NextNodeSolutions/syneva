// Native WAAPI easings Motion cannot pass through (steps()) are rebuilt as
// keyframes: each step holds its value until the next one starts, with a
// duplicate offset making the jump instantaneous. The result is exact, not a
// sampled linear() approximation.
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
