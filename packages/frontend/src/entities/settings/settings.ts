import { cx } from '@shared/lib/cx'
import { dark } from '@syneva/design-system/themes.stylex'

import type { Settings } from './model'

export const DEFAULT_SETTINGS: Settings = {
	appearance: 'light',
	lineDiffType: 'word-alt',
	diffIndicators: 'bars',
	hunkSeparators: 'line-info',
	overflow: 'wrap',
	lineHighlight: 'full',
	theme: 'pierre-light',
	font: 'geist-mono',
	uiFont: 'geist',
	fontSize: 12.5,
	// 2 columns is @pierre's own fallback, which is what every desk rendered before this setting existed - keeping it as the default means the preference arrives without silently re-indenting anyone's diff.
	tabSize: 2,
	showUnchanged: false,
	unchangedLines: 'collapse',
	hideReviewed: false,
	progressBy: 'lines',
	sidebarDefault: 'tree',
	markdownView: 'auto',
	stageOnAccept: false,
	editorCommand: '',
}

type FontDef = { label: string; stack: string; google: string | null }

const MONO_FONTS = {
	'jetbrains-mono': {
		label: 'JetBrains Mono',
		stack: "'JetBrains Mono'",
		google: 'JetBrains+Mono:wght@400;500;600;700',
	},
	'geist-mono': {
		label: 'Geist Mono',
		stack: "'Geist Mono'",
		google: null,
	},
	'fira-code': {
		label: 'Fira Code',
		stack: "'Fira Code'",
		google: 'Fira+Code:wght@400;500;600;700',
	},
	'ibm-plex-mono': {
		label: 'IBM Plex Mono',
		stack: "'IBM Plex Mono'",
		google: 'IBM+Plex+Mono:wght@400;500;600;700',
	},
	'source-code-pro': {
		label: 'Source Code Pro',
		stack: "'Source Code Pro'",
		google: 'Source+Code+Pro:wght@400;500;600;700',
	},
	'roboto-mono': {
		label: 'Roboto Mono',
		stack: "'Roboto Mono'",
		google: 'Roboto+Mono:wght@400;500;600;700',
	},
}

export const FONTS: Record<string, FontDef> = MONO_FONTS
const DEFAULT_MONO: FontDef = MONO_FONTS['geist-mono']

const SANS_FONTS_TABLE = {
	inter: {
		label: 'Inter',
		stack: "'Inter'",
		google: 'Inter:wght@400;500;600;700',
	},
	geist: {
		label: 'Geist',
		stack: "'Geist'",
		google: null,
	},
	'ibm-plex-sans': {
		label: 'IBM Plex Sans',
		stack: "'IBM Plex Sans'",
		google: 'IBM+Plex+Sans:wght@400;500;600;700',
	},
	system: {
		label: 'System',
		stack: "system-ui, -apple-system, 'Segoe UI', Roboto",
		google: null,
	},
}

export const SANS_FONTS: Record<string, FontDef> = SANS_FONTS_TABLE
const DEFAULT_SANS: FontDef = SANS_FONTS_TABLE['geist']

export function loadSettings(): Settings {
	return { ...DEFAULT_SETTINGS }
}

function ensureFont(key: string, google: string | null): void {
	if (!google || document.getElementById(`font-${key}`)) return
	const link = document.createElement('link')
	link.id = `font-${key}`
	link.rel = 'stylesheet'
	link.href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`
	document.head.appendChild(link)
}

// @pierre colors rows via CSS custom props with `…-override` hooks that inherit into its shadow DOM; the overrides must be concrete colors at :root.
// A value referencing @pierre's own --diffs-*-base (only defined inside its shadow) is invalid there and reverts; fixed diff green/red read fine on all themes.
const DIFF_VARS = [
	'--diffs-bg-addition-override',
	'--diffs-bg-deletion-override',
	'--diffs-bg-addition-emphasis-override',
	'--diffs-bg-deletion-emphasis-override',
]
const ADD = '56,160,90',
	DEL = '229,83,75'
const SUBTLE_ROW_ALPHA = 0.5
const EMPHASIS_ALPHA = 0.34

function applyLineHighlight(level: Settings['lineHighlight']): void {
	const root = document.documentElement.style
	if (level === 'full') {
		for (const v of DIFF_VARS) root.removeProperty(v)
		return
	}
	const rowA = level === 'off' ? 0 : SUBTLE_ROW_ALPHA
	root.setProperty(
		'--diffs-bg-addition-override',
		rowA ? `rgba(${ADD},${rowA})` : 'transparent',
	)
	root.setProperty(
		'--diffs-bg-deletion-override',
		rowA ? `rgba(${DEL},${rowA})` : 'transparent',
	)
	root.setProperty(
		'--diffs-bg-addition-emphasis-override',
		`rgba(${ADD},${EMPHASIS_ALPHA})`,
	)
	root.setProperty(
		'--diffs-bg-deletion-emphasis-override',
		`rgba(${DEL},${EMPHASIS_ALPHA})`,
	)
}

// A reviewer who never picked a code theme gets the one matching the chrome when they switch appearance; a picked theme is left alone.
const PAIRED_CODE_THEMES: Record<Settings['appearance'], string> = {
	light: 'pierre-light',
	dark: 'pierre-dark',
}

export function pairedCodeTheme(appearance: string): string {
	return appearance === 'dark'
		? PAIRED_CODE_THEMES.dark
		: PAIRED_CODE_THEMES.light
}

const DARK_THEME = cx(dark).split(' ').filter(Boolean)
const SELECTION_LIGHT = '#8eb5bf'
const SELECTION_DARK = '#2c5d6c'

// Two CSS-var families (--mono for code, --sans for chrome); @pierre/diffs has no font option but reads its --diffs-font-* custom props in its shadow DOM, so we drive them from the code font/size.
export function applyAppearance(s: Settings): void {
	// A settings file written by hand (or by an older Syneva) can name a font this build no longer ships: the lookup falls back to the shipped default rather than rendering nothing.
	const f = FONTS[s.font] ?? DEFAULT_MONO
	const sf = SANS_FONTS[s.uiFont] ?? DEFAULT_SANS
	ensureFont(s.font, f.google)
	ensureFont(s.uiFont, sf.google)
	const light = s.appearance === 'light'
	for (const name of DARK_THEME)
		document.documentElement.classList.toggle(name, !light)
	document.documentElement.style.colorScheme = light ? 'light' : 'dark'
	const monoStack = `${f.stack}, ui-monospace, monospace`
	const root = document.documentElement.style
	root.setProperty('--mono', monoStack)
	root.setProperty(
		'--sans',
		`${sf.stack}, system-ui, -apple-system, sans-serif`,
	)
	root.setProperty('--code-size', `${s.fontSize}px`)
	root.setProperty('--diffs-font-family', monoStack)
	root.setProperty('--diffs-font-size', `${s.fontSize}px`)
	root.setProperty('--diffs-tab-size', String(s.tabSize))
	applyLineHighlight(s.lineHighlight)
	// @pierre's default mix target is the bright "modified" blue, which reads as distracting on a
	// review surface, so it is overridden with --accent-line; the registered @property <color> values
	// must be concrete colors at :root, one per appearance.
	const selection = light ? SELECTION_LIGHT : SELECTION_DARK
	root.setProperty('--diffs-bg-selection-override', selection)
	root.setProperty('--diffs-bg-selection-number-override', selection)
}
