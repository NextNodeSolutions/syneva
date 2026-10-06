import { TURNS } from '@entities/hub/turn'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'

// How the overview shows the hub: three displays of the same desks and the same journal (the
// circuit by default, the board, the cockpit), the station the circuit narrows its list to,
// and the filters. All of it lives in the URL, so a view is a link that survives a reload; the
// display last picked is also remembered for a visit with no view in its URL.

export type Layout = 'circuit' | 'board' | 'cockpit'
export const LAYOUTS: readonly Layout[] = ['circuit', 'board', 'cockpit']
export const DEFAULT_LAYOUT: Layout = 'circuit'

// What a desk reviews, as the filter names it.
export type ModeKey = 'working' | 'staged' | 'file' | 'pr'
export const MODE_KEYS: readonly ModeKey[] = ['working', 'staged', 'file', 'pr']

export type DeskFilter = {
	projects: readonly string[]
	modes: readonly ModeKey[]
}

export type OverviewView = {
	layout: Layout
	// The circuit's selected station; null shows every turn.
	station: Turn | null
	filter: DeskFilter
}

const PARAM = {
	view: 'view',
	station: 'station',
	project: 'project',
	mode: 'mode',
} as const

function isLayout(name: string | null): name is Layout {
	return LAYOUTS.some(layout => layout === name)
}

function isStation(name: string | null): name is Turn {
	return TURNS.some(turn => turn === name)
}

function isModeKey(name: string): name is ModeKey {
	return MODE_KEYS.some(mode => mode === name)
}

function listParam(params: URLSearchParams, name: string): string[] {
	return (params.get(name) ?? '').split(',').filter(Boolean)
}

export function readView(search: string, remembered: Layout): OverviewView {
	const params = new URLSearchParams(search)
	const view = params.get(PARAM.view)
	const station = params.get(PARAM.station)
	return {
		layout: isLayout(view) ? view : remembered,
		station: isStation(station) ? station : null,
		filter: {
			projects: listParam(params, PARAM.project),
			modes: listParam(params, PARAM.mode).filter(isModeKey),
		},
	}
}

// The query that names a view; the defaults are left out, so the plain overview stays `/`.
export function viewSearch(view: OverviewView): string {
	const params = new URLSearchParams()
	if (view.layout !== DEFAULT_LAYOUT) params.set(PARAM.view, view.layout)
	if (view.station) params.set(PARAM.station, view.station)
	if (view.filter.projects.length)
		params.set(PARAM.project, view.filter.projects.join(','))
	if (view.filter.modes.length)
		params.set(PARAM.mode, view.filter.modes.join(','))
	const query = params.toString()
	return query ? `?${query}` : ''
}

// What a desk (or a journal event, which names its desk the same way) reviews.
export function modeKeyOf(subject: Pick<HubDesk, 'mode' | 'staged'>): ModeKey {
	if (subject.mode === 'file' || subject.mode === 'pr') return subject.mode
	return subject.staged ? 'staged' : 'working'
}

// Whether a desk, or the desk a journal event is about, passes the filters.
export function passes(
	subject: Pick<HubDesk, 'projectId' | 'mode' | 'staged'>,
	filter: DeskFilter,
): boolean {
	return (
		(!filter.projects.length ||
			filter.projects.includes(subject.projectId)) &&
		(!filter.modes.length || filter.modes.includes(modeKeyOf(subject)))
	)
}

export function isFiltered(filter: DeskFilter): boolean {
	return filter.projects.length > 0 || filter.modes.length > 0
}

export function applyFilter(
	desks: readonly HubDesk[],
	filter: DeskFilter,
): HubDesk[] {
	return desks.filter(desk => passes(desk, filter))
}
