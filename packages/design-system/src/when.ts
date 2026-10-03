// A StyleX value that applies only under a condition (a media query, a
// pseudo-class, an ancestor marker's state): nothing by default, `T` where
// the condition holds. Nest it for a condition inside another.
export type When<T> = { readonly default: null } & Readonly<
	Record<string, T | null>
>
