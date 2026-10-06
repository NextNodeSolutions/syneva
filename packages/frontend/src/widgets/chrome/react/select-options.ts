export type Option = { value: string; name: string }
export type OptionGroup = { group: string; options: Option[] }

export const opts = (...pairs: [string, string][]): Option[] =>
	pairs.map(([value, name]) => ({ value, name }))
