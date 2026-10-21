// The desk tab's half of the hub's stream (RFC 0001, 4.6): its desk's pulses, and whether the hub
// still lists the desk. Loaded once the first file is painted (main.tsx), where the tab used to
// start polling /poll; the hub pushes, and nothing here re-asks on a timer.
import { hubOfId } from '@entities/hub/hub-ids'
import { hubLink } from '@entities/hub/link'
import {
	hubView,
	retryWhenHubAnswers,
	subscribeHub,
} from '@entities/hub/stream'
import { fetchPulse } from '@entities/review/api'
import { readStreamPulse } from '@entities/review/pulse'
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
import { hearHub } from './relay-notice'
import { saver, S, toast } from './store'

import type { HubDesk, HubRef } from '@entities/hub/model'
import type { HubRetry } from '@entities/hub/stream'
import type { StreamView } from '@entities/hub/stream-view'
import type { DeskPulse, StreamPulse } from '@entities/review/model'

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
// The web's last word on this desk's hub, as the stream holds it (null: it has not said, or this is
// the local hub, which is the page's own).
let hubWord: HubRef | null = null
// A moved review is waiting for the reviewer's unsaved work (see holdBack).
let isHeldBack = false
// The whole pulse last read at GET …/pulse for a partial one, with the digest it was read for.
let lastWhole: { digest: string; pulse: DeskPulse } | null = null
// A read the hub left unanswered (a moved review's /state, a partial pulse's …/pulse), read again
// when the hub next answers (see readNewestAgain); set up by followDesk.
let readRetry: HubRetry | null = null

// The desk is gone when its hub says so - its `closed` frame, or a snapshot without it (after the
// tab was away) - never because the socket dropped, nor because another hub spoke first. Only a
// change counts: the tab's own Close marks the desk gone before its `closed` frame arrives.
function notePresence(
	desks: readonly HubDesk[] | null,
	settledHubs: ReadonlySet<string>,
): void {
	if (!desks || !settledHubs.has(hubOfId(deskId))) return
	const isListed = desks.some(desk => desk.id === deskId)
	if (isListed === wasListed) return
	wasListed = isListed
	S.deskClosed = !isListed
}

// The web tells the tab where a hub stands when its socket opens or closes, and again with each
// connect's listing and each hello of the hub: every such word is a new one, even when it says the
// same, and the strip weighs it against the desk's own requests (relay-notice.ts). A desk whose
// hub goes away is covered at once, before a request fails, and the cover leaves when the hub is
// back.
function noteHub(view: StreamView): void {
	if (view.mode !== 'web') return
	const hub = view.hubs.get(hubOfId(deskId))
	if (!hub || hub === hubWord) return
	const wasOffline = hubWord?.isOnline === false
	hubWord = hub
	// A tab that never got its review (the hub was offline when it loaded) has nothing to resume.
	if (hub.isOnline && wasOffline && !S.state) window.location.reload()
	hearHub(hub.isOnline)
}

function heardHub(): void {
	const view = hubView()
	noteHub(view)
	const link = hubLink(view.stream, view.identity)
	S.hubStatus = link.status
	S.hubRetryAt = link.retryAt
	notePresence(view.listing.desks, view.settledHubs)
	// A tab that never got its review adopts no pulse: it reloads once its hub is back (noteHub).
	if (!S.state) return
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
	let read: StreamPulse
	try {
		read = await readStreamPulse(raw)
	} catch {
		return
	}
	const pulse = read.kind === 'whole' ? read.pulse : await completed(read)
	if (pulse) await adopt(pulse)
}

// A partial pulse is read whole at GET …/pulse once per digest: the read answers the newest
// pulse, so pulses that queued meanwhile are not read one by one. While the digest stays, the
// parts left out are the ones last read, and the head (a status line, the desk's liveness, a
// moved diff) is laid over them. A read the hub left unanswered waits for it to answer again.
async function completed(
	partial: Extract<StreamPulse, { kind: 'partial' }>,
): Promise<DeskPulse | null> {
	if (lastWhole?.digest === partial.digest)
		return { ...lastWhole.pulse, ...partial.head }
	try {
		const pulse = await fetchPulse()
		lastWhole = { digest: partial.digest, pulse }
		readRetry?.settled()
		return pulse
	} catch {
		readRetry?.failed()
		return null
	}
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
	if (await adoptReload()) readRetry?.settled()
	else readRetry?.failed()
}

// A read the hub left unanswered goes again through the desk's newest pulse, as a pulse would
// bring it, so a reload still waits for the reviewer's unsaved work. A pulse being read already
// does it (that read reads again, or finds the review current).
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
	readRetry = retryWhenHubAnswers(readNewestAgain)
}
