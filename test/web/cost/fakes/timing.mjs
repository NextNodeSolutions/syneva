// Time helpers the fakes and the tests share.
import { setTimeout as delay } from 'node:timers/promises'

export { delay }

// Resolves with `body`'s result, or rejects with `what` after `ms`; the timer never outlives it.
export function within(ms, what, body) {
	let timer = null
	const late = new Promise((_resolve, reject) => {
		timer = setTimeout(() => {
			reject(new Error(`no ${what} within ${ms} ms`))
		}, ms)
	})
	return Promise.race([Promise.resolve(body), late]).finally(() => {
		clearTimeout(timer)
	})
}

export const median = values => {
	const sorted = values.toSorted((one, other) => one - other)
	return sorted[Math.floor(sorted.length / 2)] ?? 0
}

export const seconds = ms => (ms / 1000).toFixed(1)
