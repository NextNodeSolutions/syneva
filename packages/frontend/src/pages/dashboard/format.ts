import type { HubDesk } from '@entities/hub/model'

export const MS_PER_SECOND = 1000
export const SECONDS_PER_MINUTE = 60
export const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const JUST_NOW_SECONDS = 10

// "just now" / "42s ago" / "5m ago" / "3h ago" / "2d ago" - coarse on purpose: the dashboard
// re-renders every poll, and a second-precise clock would flicker without informing. `at` is
// an ISO timestamp (the hub's fields) or ms since the epoch (the page's own clock).
export function relativeTime(at: string | number, now: number): string {
	const then = typeof at === 'number' ? at : Date.parse(at)
	const elapsedSeconds = Math.max(0, Math.round((now - then) / MS_PER_SECOND))
	if (Number.isNaN(elapsedSeconds)) return ''
	if (elapsedSeconds < JUST_NOW_SECONDS) return 'just now'
	if (elapsedSeconds < SECONDS_PER_MINUTE) return `${elapsedSeconds}s ago`
	const minutes = Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)
	if (minutes < MINUTES_PER_HOUR) return `${minutes}m ago`
	const hours = Math.floor(minutes / MINUTES_PER_HOUR)
	if (hours < HOURS_PER_DAY) return `${hours}h ago`
	return `${Math.floor(hours / HOURS_PER_DAY)}d ago`
}

// A day as a date reads it short ("Oct 6"): a journal line older than today, a chart's day.
export const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
})

// "1 desk" / "3 desks"; a noun whose plural is not its singular plus s names it ("repository",
// "repositories").
export function plural(
	count: number,
	noun: string,
	nouns = `${noun}s`,
): string {
	return `${count} ${count === 1 ? noun : nouns}`
}

// A count that opens a sentence is spelled out while it is a word a reader takes in at a
// glance ("Two desks wait on you."); from ten on, digits read faster.
const NUMBER_WORDS = [
	'Zero',
	'One',
	'Two',
	'Three',
	'Four',
	'Five',
	'Six',
	'Seven',
	'Eight',
	'Nine',
] as const

export function numberWord(count: number): string {
	return NUMBER_WORDS[count] ?? String(count)
}

export function lastSegment(path: string | undefined): string {
	return path?.replace(/\/+$/, '').split('/').pop() ?? ''
}

type ModeSubject = Pick<HubDesk, 'mode' | 'staged' | 'target' | 'session'>

// A pull request named by its number, bare or inside a GitHub URL.
const PR_NUMBER = /^(?<bare>\d+)$|\/pull\/(?<linked>\d+)/

// What a desk reviews, in the words of the command that opened it: the working tree, the
// staged changes, one file, or a branch or pull request (by number when it has one) - as
// the parts a meta line joins. A closed desk's journal event names it the same way.
export function modeParts(desk: ModeSubject): string[] {
	if (desk.mode === 'file') return ['file', lastSegment(desk.target)]
	if (desk.mode === 'pr') return ['pr', pullRequestName(desk)]
	return [desk.staged ? 'staged' : 'working tree']
}

const SEPARATOR = ' · '
const NO_BREAK_SPACE = '\u00a0'

export function modeLabel(desk: ModeSubject): string {
	return modeParts(desk).join(SEPARATOR)
}

// Words a narrow line never parts ("every 2 s", "active 2m ago"): their spaces do not break.
export function unbroken(words: string): string {
	return words.replaceAll(' ', NO_BREAK_SPACE)
}

function pullRequestName(desk: ModeSubject): string {
	const found = desk.target?.match(PR_NUMBER)?.groups
	const number = found?.bare ?? found?.linked
	if (number) return `#${number}`
	return desk.target ?? desk.session
}

// A repository root as its owner reads it: the home directory folds to ~ (macOS /Users/<name>,
// Linux /home/<name>). The full path stays in the element's title.
const HOME_DIRECTORY = /^\/(?:Users|home)\/[^/]+(?=\/|$)/

export function displayRoot(root: string): string {
	return root.replace(HOME_DIRECTORY, '~')
}

// Left-to-right marks: a path is set in a right-to-left box (so it is cut from its start, its
// meaningful end kept), and its leading "~/" and trailing "/" would otherwise move to the other
// end.
export const LTR_MARK = '\u200e'
