const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60

// How long until `at`, as a wait reads it: seconds under a minute, minutes past it ("28s", "5m").
// The page's clock is coarse (useNow), so a minute's wait read a tick late still says "1m".
export function untilWords(at: number, now: number): string {
	const seconds = Math.max(0, Math.ceil((at - now) / MS_PER_SECOND))
	if (seconds < SECONDS_PER_MINUTE) return `${seconds}s`
	return `${Math.round(seconds / SECONDS_PER_MINUTE)}m`
}
