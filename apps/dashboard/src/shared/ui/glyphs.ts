export const GLYPH_VIEW_BOX = '0 0 24 24'

export const GLYPHS = {
	chevron: 'm9 18 6-6-6-6',
	folder: 'M3 6.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5h-7.25L10.5 5h-6A1.5 1.5 0 0 0 3 6.5Z',
	file: 'M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8ZM14 3v5h5',
	collapseAll: 'm7 11 5-5 5 5M7 18l5-5 5 5',
	expandAll: 'm7 6 5 5 5-5M7 13l5 5 5-5',
	menu: 'M4 5h16M4 12h16M4 19h16',
} as const

export type GlyphName = keyof typeof GLYPHS
