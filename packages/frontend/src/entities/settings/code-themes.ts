// Every name is one @pierre/diffs resolves, and the settings decoder accepts nothing else: a theme name Pierre can't resolve blanks the diff.
export type CodeThemeGroup = {
	group: string
	options: { value: string; name: string }[]
}

const themeGroup = (
	group: string,
	...pairs: [string, string][]
): CodeThemeGroup => ({
	group,
	options: pairs.map(([value, name]) => ({ value, name })),
})

export const CODE_THEMES: CodeThemeGroup[] = [
	themeGroup(
		'Dark',
		['material-theme-palenight', 'Palenight'],
		['material-theme-darker', 'Material Darker'],
		['github-dark', 'GitHub Dark'],
		['dracula', 'Dracula'],
		['ayu-dark', 'Ayu Dark'],
		['gruvbox-dark-medium', 'Gruvbox'],
		['everforest-dark', 'Everforest'],
		['dark-plus', 'Dark+ (VS Code)'],
	),
	themeGroup(
		'Light',
		['github-light', 'GitHub Light'],
		['one-light', 'One Light'],
		['vitesse-light', 'Vitesse Light'],
		['catppuccin-latte', 'Catppuccin Latte'],
		['everforest-light', 'Everforest Light'],
		['light-plus', 'Light+ (VS Code)'],
	),
	themeGroup(
		'Pierre',
		['pierre-dark', 'Pierre Dark'],
		['pierre-dark-soft', 'Pierre Dark Soft'],
		['pierre-light', 'Pierre Light'],
	),
]

export function isCodeTheme(name: string): boolean {
	return CODE_THEMES.some(({ options }) =>
		options.some(({ value }) => value === name),
	)
}
