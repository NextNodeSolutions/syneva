// A StyleX conditional value: nothing by default, `T` where the condition holds.
export type When<T> = { readonly default: null } & Readonly<
	Record<string, T | null>
>
