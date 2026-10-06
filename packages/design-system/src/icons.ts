// Line icons every front draws: one path each on a 24-unit grid, stroked in currentColor, never filled; each front sets its own stroke width.
export const ICON_VIEW_BOX = '0 0 24 24'

export const ICONS = {
	desk: 'M3 5h18v14H3zM10 5v14M13 11.5l2 2 4-4.5',
	guide: 'M3 5h3v3H3zM3 10.5h3v3H3zM3 16h3v3H3zM9 6.5h12M9 12h12M9 17.5h7',
	ask: 'M4 4h16v11h-9l-5 4v-4H4zM9.5 8.4a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 13.4v.1',
	plan: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h3v6h4M12 11h4',
	tree: 'M4 3v18M4 7h5M4 15h5M9 5h11v4H9zM9 13h11v4H9z',
	staged: 'M3 9.5 12 5l9 4.5-9 4.5zM3 14l9 4.5 9-4.5',
	branch: 'M6 3v12M6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM18 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM18 9c0 4-3 6-12 6',
	file: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4',
	start: 'M3 5h18v14H3zM7 10l3 2.5L7 15M12.5 15h4.5',
	agent: 'M3 8h6v8H3zM15 8h6v8h-6zM9 12h6M12 9.5v5',
	faq: 'M4 4h16v16H4zM9.5 9.4a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 16.2v.1',
	changelog: 'M6 3v18M10 6h10M10 12h10M10 18h7M4.5 6h3M4.5 12h3M4.5 18h3',
	source: 'M8 4c-2 0-3 1-3 3v3l-2 2 2 2v3c0 2 1 3 3 3M16 4c2 0 3 1 3 3v3l2 2-2 2v3c0 2-1 3-3 3',
} as const

export type IconName = keyof typeof ICONS

// The primary action's arrow: 20-unit grid (not 24), stroked like the icons.
export const ARROW_VIEW_BOX = '0 0 20 20'
export const ARROW_PATH = 'M4 10h12m-5-5 5 5-5 5'
