import type { WorkerPoolOptions } from '@pierre/diffs/react'

// Each worker boots its own highlighter, so a few cover a review without competing with the first paint.
const POOL_SIZE = 2

// Highlighting runs off the main thread: a diff paints plain rows at once and colors land when a worker finishes.
export const DIFF_WORKER_POOL: WorkerPoolOptions = {
	workerFactory: () =>
		new Worker(new URL('@pierre/diffs/worker/worker.js', import.meta.url), {
			type: 'module',
		}),
	poolSize: POOL_SIZE,
}
