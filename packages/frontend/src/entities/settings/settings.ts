import { cx } from '@shared/lib/cx'
import { dark } from '@syneva/design-system/themes.stylex'

import type { Settings } from './model'

export const DEFAULT_SETTINGS: Settings = {
	// The public site's light field is the desk's default too; the night theme is a setting.
	appearance: 'light',
	lineDiffType: 'word-alt',
	diffIndicators: 'bars',
	hunkSeparators: 'line-info',
	overflow: 'wrap',
	lineHighlight: 'full',
	// Code defaults to Pierre Light (a @pierre/diffs theme), paired with the light chrome.
	// Comment/markdown code blocks highlight through Pierre's shared highlighter, so they carry
	// it too.
	theme: 'pierre-light',
	// Geist and Geist Mono, the design system's two voices, ship with the desk (no font host).
	font: 'geist-mono',
	uiFont: 'geist',
	fontSize: 12.5,
	// 2 columns is @pierre's own fallback (`tab-size: var(--diffs-tab-size, 2)`), which is what
	// every desk rendered before this setting existed - keeping it as the default means the
	// preference arrives without silently re-indenting anyone's diff.
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

// Curated mono fonts for code - the diff and comment/markdown code. Geist Mono ships with the
// desk (@syneva/design-system/fonts.css); the others load from Google Fonts on selection. The
// literal object keeps its keys so the shipped defaults below can be read without
// noUncheckedIndexedAccess doubt.
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

// Curated sans fonts for the UI chrome (everything that isn't code). Geist ships with the desk
// and "system" loads nothing; the others load from Google Fonts on selection.
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

// Settings persist in ~/.syneva/settings.json (via /settings), NOT localStorage -
// localStorage is keyed by origin, so it would not follow the reviewer to another browser or
// a hosted hub. The store initializes with these defaults and the
// init sequence in main.ts folds the server file in before first paint.
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

// @pierre/diffs colors rows via CSS custom props with `…-override` hooks; these inherit
// into its shadow DOM and resolve at the use-site (where --diffs-*-base is defined), so we
// can dim the whole-row tint while keeping the word-level emphasis - theme-aware.
// @pierre registers these via @property (<color>), so the override must be a concrete
// color at :root - a value referencing @pierre's own --diffs-*-base (only defined inside
// its shadow) is invalid there and reverts. Fixed diff green/red read fine on all themes.
const DIFF_VARS = [
	'--diffs-bg-addition-override',
	'--diffs-bg-deletion-override',
	'--diffs-bg-addition-emphasis-override',
	'--diffs-bg-deletion-emphasis-override',
]
const ADD = '56,160,90',
	DEL = '229,83,75'
// The row bg is color-mix(~80% page-bg, 20% of this target), so a low-alpha target reads as fully
// gone. This lands Subtle clearly between Full and Off; Off = transparent (flat).
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
	// keep the changed words prominent once the row is quiet
	root.setProperty(
		'--diffs-bg-addition-emphasis-override',
		`rgba(${ADD},${EMPHASIS_ALPHA})`,
	)
	root.setProperty(
		'--diffs-bg-deletion-emphasis-override',
		`rgba(${DEL},${EMPHASIS_ALPHA})`,
	)
}

// The code theme each appearance ships with. A reviewer who never picked a code theme gets the
// one that matches the chrome when they switch appearance; a picked theme is left alone.
const PAIRED_CODE_THEMES: Record<Settings['appearance'], string> = {
	light: 'pierre-light',
	dark: 'pierre-dark',
}

export function pairedCodeTheme(appearance: string): string {
	return appearance === 'dark'
		? PAIRED_CODE_THEMES.dark
		: PAIRED_CODE_THEMES.light
}

// The night theme's classes (a StyleX theme over the design system's palette), toggled on <html>.
const DARK_THEME = cx(dark).split(' ').filter(Boolean)
// The selection wash's mix target per appearance: the palette's petrol rule tone, as a
// concrete color (--accent-line in each theme).
const SELECTION_LIGHT = '#8eb5bf'
const SELECTION_DARK = '#2c5d6c'

// Fonts + size are ours (CSS vars). Two families: --mono (code) and --sans (UI chrome). We also
// drive @pierre/diffs' own --diffs-font-* vars from the code font/size so the diff matches the
// Code font setting (the lib has no font option, but reads these custom props in its shadow DOM).
export function applyAppearance(s: Settings): void {
	// A settings file written by hand (or by an older Syneva) can name a font this build no longer
	// ships, so the lookup falls back to the shipped default rather than rendering nothing.
	const f = FONTS[s.font] ?? DEFAULT_MONO
	const sf = SANS_FONTS[s.uiFont] ?? DEFAULT_SANS
	ensureFont(s.font, f.google)
	ensureFont(s.uiFont, sf.google)
	// Swap the whole palette by tagging <html> with the design system's night theme (light is
	// the tokens' own default), so every surface - and @pierre's shadow DOM, which inherits the
	// custom properties - reads the same variables in either mode. color-scheme flips the native
	// form controls and scrollbars with it.
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
	// Tone down @pierre's line-selection highlight (the [data-selected-line] wash). Its default
	// mix target is the bright "modified" blue, which reads as distracting on a review surface -
	// override it with the petrol rule tone (--accent-line) so a selected/cursored row is a calm
	// tint of the desk's interaction hue. @pierre registers these as @property <color>, so they
	// must be concrete colors set at :root, one per appearance.
	const selection = light ? SELECTION_LIGHT : SELECTION_DARK
	root.setProperty('--diffs-bg-selection-override', selection)
	root.setProperty('--diffs-bg-selection-number-override', selection)
}
