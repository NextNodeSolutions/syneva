// The desk tab's half of the hub's stream (RFC 0001, 4.6): its desk's pulses, and whether the hub
// still lists the desk. Loaded once the first file is painted (main.tsx), where the tab used to
// start polling /poll; the hub pushes, and nothing here re-asks on a timer.
import { hubLink } from '@entities/hub/link'
import {
	hubView,
	retryWhenHubAnswers,
	subscribeHub,
} from '@entities/hub/stream'
import { readDeskPulse } from '@entities/review/pulse'
import { deferRender } from '@pages/desk/render'
import { deskIdFromLocation } from '@shared/api/base'
import { subscribeStoreFields } from '@shared/lib/reactive'
import { updateAwaitingDom } from '@widgets/diff-view/awaiting'

import {
	adoptGuide,
	adoptIncomingComments,
	adoptIncomingDomainComments,
	adoptReload,
} from './desk-adopt'
import { adoptLiveness, isCurrentDesk } from './desk-instance'
import { saver, S, toast } from './store'

import type { HubDesk } from '@entities/hub/model'
import type { HubRetry } from '@entities/hub/stream'
import type { DeskPulse } from '@entities/review/model'

const COMPOSER_FIELDS = ['composerOpen', 'fileComposerOpen']

// Read once this module loads, on a desk page whose first paint is done.
const deskId = deskIdFromLocation(window.location.pathname)

// The pulse last handed over, by identity: the store commits on every frame of the hub, and this
// desk's pulse only moves with its own.
let heard: unknown
// Pulses are read one at a time, latest wins: one that lands while another is being adopted
// waits here, replaced by any newer one.
let waiting: unknown
let isReading = false
// Whether the hub's last whole listing named this desk; null before the first.
let wasListed: boolean | null = null
// A moved review is waiting for the reviewer's unsaved work (see holdBack).
let isHeldBack = false
// A moved review whose read the hub left unanswered, read again when the hub next answers (see
// readNewestAgain); set up by followDesk.
let stateRetry: HubRetry | null = null

// The desk is gone when the hub says so - its `closed` frame, or a listing without it (a snapshot
// after the tab was away) - never because the socket dropped. Only a change counts: the tab's own
// Close marks the desk gone before its `closed` frame arrives.
function notePresence(desks: readonly HubDesk[] | null): void {
	if (!desks) return
	const isListed = desks.some(desk => desk.id === deskId)
	if (isListed === wasListed) return
	wasListed = isListed
	S.deskClosed = !isListed
}

function heardHub(): void {
	const view = hubView()
	const link = hubLink(view.stream, view.identity)
	S.hubStatus = link.status
	S.hubRetryAt = link.retryAt
	notePresence(view.listing.desks)
	const raw = view.pulses.get(deskId)
	if (!raw || raw === heard) return
	heard = raw
	receive(raw)
}

function receive(raw: unknown): void {
	waiting = raw
	if (!isReading) void readWaiting()
}

async function readWaiting(): Promise<void> {
	const raw = waiting
	waiting = undefined
	isReading = true
	try {
		await readOne(raw)
	} finally {
		isReading = false
	}
	if (waiting) await readWaiting()
}

// A pulse that does not read (a malformed payload, a guide decoder chunk that did not load) is
// dropped: the desk's next pulse is read whole again.
async function readOne(raw: unknown): Promise<void> {
	let pulse: DeskPulse
	try {
		pulse = await readDeskPulse(raw)
	} catch {
		return
	}
	await adopt(pulse)
}

// Fetch the browser review only when baseDiffHash moves; a pulse never carries the file/change
// arrays.
async function adopt(pulse: DeskPulse): Promise<void> {
	if (!isCurrentDesk(pulse.serverInstanceId)) {
		adoptLiveness({})
		updateAwaitingDom()
		return
	}
	adoptLiveness(pulse)
	updateAwaitingDom()
	if (pulse.baseDiffHash !== S.lastBaseDiffHash) {
		if (isHeld()) void holdBack()
		else await reload()
		return
	}
	const guideChanged = adoptGuide(pulse)
	const commentsChanged = adoptIncomingComments(pulse.comments)
	const threadsChanged = adoptIncomingDomainComments(pulse.domainComments)
	if (guideChanged) toast('Guide updated')
	// These arrive while the reviewer may be mid-scroll or mid-compose: they must not stack a synchronous full rebuild on top of their interaction.
	if (guideChanged || commentsChanged || threadsChanged) deferRender()
}

async function reload(): Promise<void> {
	if (await adoptReload()) stateRetry?.settled()
	else stateRetry?.failed()
}

// A reload the hub left unanswered goes again through the desk's newest pulse, as a pulse would
// bring it, so it still waits for the reviewer's unsaved work. A pulse being read already does it
// (that read reloads, or finds the review current).
function readNewestAgain(): void {
	if (isReading || waiting) return
	const raw = hubView().pulses.get(deskId)
	if (raw) receive(raw)
}

// The reload replaces S.state wholesale and re-renders, which would clobber decisions/comments not
// yet persisted and rebuild the diff DOM under an open composer (losing in-progress typing).
function isHeld(): boolean {
	return saver.isBusy() || isComposing()
}

// So a moved review waits until the saves have landed and the composers are closed, then the
// desk's newest pulse is read again (a save started meanwhile holds it back once more). Liveness
// and every other desk change keep flowing meanwhile, so the desk never looks dead.
async function holdBack(): Promise<void> {
	if (isHeldBack) return
	isHeldBack = true
	await saver.quiet()
	await composersClosed()
	isHeldBack = false
	const raw = hubView().pulses.get(deskId)
	if (raw) receive(raw)
}

function isComposing(): boolean {
	return S.composerOpen || S.fileComposerOpen
}

function composersClosed(): Promise<void> {
	return new Promise(resolve => {
		if (!isComposing()) {
			resolve()
			return
		}
		const stop = subscribeStoreFields(COMPOSER_FIELDS, () => {
			if (isComposing()) return
			stop()
			resolve()
		})
	})
}

// The tab follows its desk for as long as it is open: the stream lives with the page.
export function followDesk(): void {
	subscribeHub(heardHub)
	stateRetry = retryWhenHubAnswers(readNewestAgain)
}
