// The code theme the reviewer picked (the settings file every desk reads), kept for the page
// that renders markdown. Read at boot, before that page loads.
let codeTheme = ''

export function keepCodeTheme(theme: string): void {
	codeTheme = theme
}

export function keptCodeTheme(): string {
	return codeTheme
}
