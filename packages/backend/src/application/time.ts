// Wall-clock stamps are an application concern, not a domain rule: the domain's pure transformations receive timestamps as values; this is the one place the desk reads the clock.

export function nowIso(): string {
	return new Date().toISOString()
}
