// Types for the build-time bundle budget (plain .mjs consumed by vite.config
// and test/benchmarks/perf-smoke.mjs). Kept in lockstep with the .mjs beside it.
export interface BundleOutput {
	bytes: number
	imports: { path: string; external: boolean; kind: string }[]
}

export type BundleManifest = Record<string, BundleOutput>

export declare function staticBundleBytes(
	outputs: BundleManifest,
	entry: string,
): number

export declare function checkBundleBudget(
	outputs: BundleManifest,
	entry: string,
): { initial: number; total: number }

export declare const INITIAL_UI_BYTES_LIMIT: number
export declare const TOTAL_UI_BYTES_LIMIT: number
