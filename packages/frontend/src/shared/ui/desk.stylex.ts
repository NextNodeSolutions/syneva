import * as stylex from '@stylexjs/stylex'

export const deskSize = stylex.defineConsts({
	topbar: '48px',
	subbar: '40px',
	churnGap: '5px',
})

export const deskText = stylex.defineConsts({
	label: '10px',
	small: '11px',
	body: '12px',
	title: '13px',
	headline: '14px',
	display: '17px',
})

export const deskVars = stylex.defineVars({
	'--left-width': '280px',
	'--notes-width': '340px',
	'--guide-width': '380px',
	'--code-size': '12.5px',
})
