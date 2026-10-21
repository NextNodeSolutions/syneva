// Test-observability counters (fileReads must stay 0 across a pr build, one parse per reload,
// concurrent reads bounded); lives in domain so the pure diff parser counts its own parses.
export const gitStats = {
	fileReads: 0,
	parses: 0,
	readsInFlight: 0,
	peakReadsInFlight: 0,
}
