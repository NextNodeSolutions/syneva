import { ICONS } from '@syneva/design-system/icons'

// The shell's line icons, on the design system's 24-unit grid and in its manner (square
// joints, one stroke, never filled): the system's own where one says the thing (a desk, a
// plan), the shell's additions where none does. Each names what it stands for in the label
// beside it or in its control's name; the icon itself is decoration.
export const SHELL_ICONS = {
	// Three stations joined: the review circuit the overview draws.
	overview:
		'M3 9h5v6H3zM16 3h5v6h-5zM16 15h5v6h-5zM8 12h4M12 6v12M12 6h4M12 18h4',
	reviews: ICONS.desk,
	projects: 'M3 5h6l2 2h10v12H3z',
	plans: ICONS.plan,
	settings:
		'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
	hub: 'M3 4h18v7H3zM3 13h18v7H3zM6.5 7.5h2M6.5 16.5h2',
	fold: 'M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2',
	unfold: 'M3 4h18v16H3zM9 4v16M14 10l2 2-2 2',
	menu: 'M4 7h16M4 12h16M4 17h16',
	close: 'M6 6l12 12M18 6 6 18',
	plus: 'M12 5v14M5 12h14',
	filter: 'M4 6h16M7 12h10M10 18h4',
	display: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4',
	board: 'M3 4h5v16H3zM10 4h5v10h-5zM17 4h4v13h-4z',
	cockpit: 'M3 20h18M6 16v-5M10 16V8M14 16v-3M18 16V6',
} as const

export type ShellIconName = keyof typeof SHELL_ICONS
