import type { Temporal } from '@js-temporal/polyfill'

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const MINUTE_STEP = { unit: 'minute', minutes: 1 } as const
const STEPS = [
	{ unit: 'day', minutes: 1440 },
	{ unit: 'hour', minutes: 60 },
	MINUTE_STEP,
] as const

export function formatAge(instant: string, now: Temporal.Instant): string {
	const elapsed = Math.max(0, now.since(instant).total('minute'))
	const step = STEPS.find(({ minutes }) => elapsed >= minutes) ?? MINUTE_STEP
	return relativeTime.format(-Math.floor(elapsed / step.minutes), step.unit)
}
