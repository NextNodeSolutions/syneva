// The option shapes the settings selects render: flat options, or labelled groups (the code
// themes - see @entities/settings/code-themes).

export type Option = { value: string; name: string }
export type OptionGroup = { group: string; options: Option[] }

export const opts = (...pairs: [string, string][]): Option[] =>
	pairs.map(([value, name]) => ({ value, name }))
