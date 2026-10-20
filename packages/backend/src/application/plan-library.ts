import path from 'node:path'

import { hash, planId, projectId } from '../domain/identity.js'
import {
	approvePlan,
	changePlanStatus,
	postPlanVersion,
} from '../domain/plan.js'

import { errorMessage } from './errors.js'
import { createSerializer } from './mutex.js'
import { nowIso } from './time.js'

import type { ReviewResult } from '@syneva/contracts/agent'
import type { PlanDesk, PlanSummary } from '@syneva/contracts/plans'
import type { PlanRecord, PlanStatusChange } from '../domain/plan.js'
import type { DeskEventDraft } from './journal.js'
import type { PlanStorePort, WorkspacePort } from './ports.js'

// A plan desk as the library knows it: its repository, the plan file it reviews (absolute, as
// the desk was opened on it) and that file's stamp on the desk at the event
// (ReviewFile.contentHash; undefined when the desk shows no file).
export type PlanDeskRef = {
	root: string
	file: string
	fileHash: string | undefined
}

// The hub's plan library (RFC 0002): the record of every plan a plan desk reviewed. It observes
// its desks' events the way the journal does, when they happen - an open or a reload posts the
// file as a version, a Send that approved the file approves it - and keeps every version
// verbatim. One serialized queue owns it, so a version and the approval that follows it apply
// in the order the desk recorded them.
export type PlanLibrary = {
	// Fire-and-forget like the journal: a desk never waits on the library, and a failed write is
	// logged, never the failure of the request that recorded the event.
	observe(
		desk: PlanDeskRef,
		draft: DeskEventDraft,
		verdicts?: ReviewResult,
	): void
	list(): Promise<PlanRecord[]>
	get(id: string): Promise<PlanRecord | null>
	// null when the plan or that version is not on disk.
	readVersion(id: string, version: number): Promise<string | null>
	// The reviewer's word; null when no plan has that id.
	changeStatus(
		id: string,
		change: PlanStatusChange,
	): Promise<PlanRecord | null>
}

type PlanFile = { id: string; path: string }

// Who a plan is: its id and its file relative to the repository, the way every listing names it.
export function planFileOf(root: string, file: string): PlanFile {
	const relative = path.relative(root, file) || path.basename(file)
	return { id: planId(root, relative), path: relative }
}

// The library's state: the store, the records once loaded, and how they load; and the text of
// every version read or written in this hub's life. A version is written once and never
// rewritten, so its text held in memory stays its text: a plan's page polls its latest version
// every few seconds, and none of those reads goes back to the disk.
type Shelf = {
	store: PlanStorePort
	workspace: Pick<WorkspacePort, 'readFile'>
	log: (line: string) => void
	records: Map<string, PlanRecord>
	load: () => Promise<Map<string, PlanRecord>>
	texts: Map<string, string>
}

const textKey = (id: string, version: number): string =>
	`${id}@${String(version)}`

export function createPlanLibrary(
	store: PlanStorePort,
	workspace: Pick<WorkspacePort, 'readFile'>,
	log: (line: string) => void,
): PlanLibrary {
	const records = new Map<string, PlanRecord>()
	const shelf: Shelf = {
		store,
		workspace,
		log,
		records,
		load: onceLoaded(store, records, log),
		texts: new Map(),
	}
	const serialize = createSerializer()
	const run = (task: () => Promise<void>, what: string): void => {
		void settle(serialize(task), shelf.log, what)
	}
	return {
		observe(desk, draft, verdicts): void {
			// Stamped now, applied in turn: `at` is when it happened, not when the queue got to it.
			const at = nowIso()
			if (draft.kind === 'desk-opened' || draft.kind === 'desk-reloaded')
				run(() => postVersion(shelf, desk, at), 'version')
			else if (
				draft.kind === 'round-sent' &&
				verdicts?.approvedFiles.length
			)
				run(() => approveLatest(shelf, desk, at), 'approval')
		},
		list: () =>
			serialize(async () =>
				[...(await shelf.load()).values()].toSorted((a, b) =>
					b.updatedAt.localeCompare(a.updatedAt),
				),
			),
		get: id => serialize(async () => (await shelf.load()).get(id) ?? null),
		readVersion: (id, version) =>
			serialize(() => readVersion(shelf, id, version)),
		changeStatus: (id, change) =>
			serialize(() => changeStatus(shelf, id, change)),
	}
}

// A task the queue runs for an event: its failure is logged, never thrown at the desk.
async function settle(
	task: Promise<void>,
	log: (line: string) => void,
	what: string,
): Promise<void> {
	try {
		await task
	} catch (error) {
		log(`plans: ${what} not recorded: ${errorMessage(error)}`)
	}
}

// Loaded on first use inside the queue, like the journal: only the hub that serves requests
// reads the library. An unreadable library is never taken for an empty one: a post would then
// start the plan over at version 1 and overwrite the record and the versions on disk. The
// failure is logged and thrown (the event's write is dropped, a read fails), and the next use
// tries again - the record is never what the hub needs to run.
function onceLoaded(
	store: PlanStorePort,
	records: Map<string, PlanRecord>,
	log: (line: string) => void,
): () => Promise<Map<string, PlanRecord>> {
	let loading: Promise<Map<string, PlanRecord>> | null = null
	const load = async (): Promise<Map<string, PlanRecord>> => {
		try {
			for (const record of await store.load())
				records.set(record.id, record)
			return records
		} catch (error) {
			loading = null
			log(`plans: unreadable: ${errorMessage(error)}`)
			throw error
		}
	}
	return () => {
		loading ??= load()
		return loading
	}
}

async function postVersion(
	shelf: Shelf,
	desk: PlanDeskRef,
	at: string,
): Promise<void> {
	const file = planFileOf(desk.root, desk.file)
	const known = (await shelf.load()).get(file.id) ?? null
	// The desk still shows the latest version (a reload that changed nothing in the plan): the
	// same content, so no version to post and no file to read.
	if (desk.fileHash && known?.versions.at(-1)?.fileHash === desk.fileHash)
		return
	const markdown = await shelf.workspace.readFile(desk.file)
	if (markdown === null) return // the file is gone: its desk says so, the record keeps what it had
	const posting = {
		...file,
		root: desk.root,
		markdown,
		contentHash: hash(markdown),
		fileHash: desk.fileHash,
		at,
	}
	const next = postPlanVersion(known, posting, path.basename(desk.file))
	if (!next) return
	const latest = next.versions.at(-1)
	if (latest) {
		await shelf.store.writeVersion(next.id, latest.number, markdown)
		shelf.texts.set(textKey(next.id, latest.number), markdown)
	}
	await keep(shelf, next)
}

async function readVersion(
	shelf: Shelf,
	id: string,
	version: number,
): Promise<string | null> {
	if (!(await shelf.load()).has(id)) return null
	const key = textKey(id, version)
	// An empty version is a text like any other: held by key, not by truthiness.
	if (shelf.texts.has(key)) return shelf.texts.get(key) ?? null
	const markdown = await shelf.store.readVersion(id, version)
	if (markdown !== null) shelf.texts.set(key, markdown)
	return markdown
}

async function approveLatest(
	shelf: Shelf,
	desk: PlanDeskRef,
	at: string,
): Promise<void> {
	const { id } = planFileOf(desk.root, desk.file)
	const known = (await shelf.load()).get(id)
	const next = known && approvePlan(known, at, desk.fileHash)
	if (next) await keep(shelf, next)
}

async function changeStatus(
	shelf: Shelf,
	id: string,
	change: PlanStatusChange,
): Promise<PlanRecord | null> {
	const known = (await shelf.load()).get(id)
	if (!known) return null
	const next = changePlanStatus(known, change, nowIso())
	await keep(shelf, next)
	return next
}

// On disk first: the library never lists a record it could not keep.
async function keep(shelf: Shelf, record: PlanRecord): Promise<void> {
	await shelf.store.save(record)
	shelf.records.set(record.id, record)
}

// The listing's projection of one record: the project named as the desks name it, and the live
// desk reviewing it now, if any.
export function planSummary(
	record: PlanRecord,
	desk: PlanDesk | null,
): PlanSummary {
	return {
		id: record.id,
		root: record.root,
		project: path.basename(record.root) || record.root,
		projectId: projectId(record.root),
		path: record.path,
		title: record.title,
		summary: record.summary,
		status: record.status,
		versions: record.versions.map(version => ({
			number: version.number,
			postedAt: version.postedAt,
			title: version.title,
			approvedAt: version.approvedAt,
		})),
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
		desk,
	}
}
