import * as stylex from '@stylexjs/stylex'

// The desk's fixed measures. The top bar and the bars under it (the sidebar's
// Tree/Walkthrough tabs, the guide bar, the notes head) share their heights,
// so their bottom rules read as one line across the column seams.
export const deskSize = stylex.defineConsts({
	topbar: '48px',
	subbar: '40px',
	// The gap between the +added / -removed counts (and a state badge), the
	// same on every surface that prints them: tree, walkthrough, diff header.
	churnGap: '5px',
})

// The desk's type scale: an application's density, a step below the public
// site's reading sizes. Labels are the chrome's voice; display is the largest
// ink on the desk (the overview headline, the oversized file's size).
export const deskText = stylex.defineConsts({
	label: '10px',
	small: '11px',
	body: '12px',
	title: '13px',
	headline: '14px',
	display: '17px',
})

// Measures written at runtime, with literal names: the pane resizers drag
// --left-width, the notes panel holds --notes-width, and Settings writes the
// code size the diff and the threads' code read.
export const deskVars = stylex.defineVars({
	'--left-width': '280px',
	'--notes-width': '340px',
	'--code-size': '12.5px',
})
