// What stays the machine's on a paired hub (RFC 0001, section 7): the web account is the trust
// boundary of a relayed request, so the web may review code in the repositories the hub serves
// and nothing more. It never reads or writes the machine's settings, it opens a file only in an
// editor the machine names, never through the OS's opener, and it opens desks only on a root the
// hub serves, on paths inside it, never in pr mode. Every editor case here is refused before
// anything is launched.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import { deskApiBase, HUB_PATHS } from '../../packages/contracts/dist/routes.js'
import { scratchRepo } from '../stream/hub-driver.mjs'

import {
	HTTP_BAD_REQUEST,
	HTTP_FORBIDDEN,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
} from './http-wire.mjs'
import { webOf } from './relay-checks.mjs'

// The machine's editor command for these checks; never launched by them.
const MACHINE_EDITOR = 'code -g {file}:{line}'
// A display preference the machine sets, then the web tries to.
const MACHINE_FONT = 13
const WEB_FONT = 15
const NOT_RELAYED = '404 NOT_RELAYED'

export async function checkMachine(context, desk) {
	context.report.section("relay: what stays the machine's")
	await checkSettings(context, desk)
	await checkEditor(context, desk)
	await checkOpens(context)
}

const postJson = body => ({
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify(body),
})

async function readSettingsFile(home) {
	const file = path.join(home, '.syneva', 'settings.json')
	return JSON.parse(await fs.readFile(file, 'utf8'))
}

// The machine's preferences are never the web's (RFC 0001, 4.7: the web keeps the person's own):
// a relayed read or write of a desk's /settings is refused before the router, and settings.json,
// which names the editor the hub runs, stays as the machine wrote it. Core's settings routes keep
// the machine's keys from a relayed request too (http/settings.ts), whatever the allowlist says.
async function checkSettings(context, desk) {
	const { report, driver, home } = context
	const web = webOf(context)
	const route = `${deskApiBase(desk.localId)}/settings`
	const relayed = `${deskApiBase(desk.webId)}/settings`
	await driver.post(route, {
		settings: { editorCommand: MACHINE_EDITOR, fontSize: MACHINE_FONT },
		diffStyle: 'split',
	})
	const before = await readSettingsFile(home)
	const read = await codeOf(await web(relayed))
	const written = await codeOf(
		await web(
			relayed,
			postJson({
				settings: { editorCommand: 'subl', fontSize: WEB_FONT },
				diffStyle: 'unified',
			}),
		),
	)
	report.check(
		'a relayed GET or POST /settings is NOT_RELAYED',
		read === NOT_RELAYED && written === NOT_RELAYED,
		`${read}, ${written}`,
	)
	const after = await readSettingsFile(home)
	report.check(
		"the machine's settings.json stays as the machine wrote it",
		isDeepStrictEqual(after, before) &&
			after.settings?.editorCommand === MACHINE_EDITOR,
		JSON.stringify(after),
	)
}

// The hub's failure code in a JSON answer.
async function codeOf(response) {
	const body = await response.json().catch(() => ({}))
	return `${response.status} ${body.code ?? ''}`
}

// With no editor set, or with the OS opener set, a relayed open-editor is EDITOR_LOCAL_ONLY; a
// path that leaves the repo through a symlink is BAD_PATH before any launch; a template whose
// program is a placeholder is BAD_EDITOR_COMMAND for the machine's own tabs too.
async function checkEditor(context, desk) {
	const { report, driver, repo, home } = context
	const web = webOf(context)
	const local = deskApiBase(desk.localId)
	const relayed = `${deskApiBase(desk.webId)}/open-editor`
	// The machine's own tabs set it; '' clears it.
	const setEditor = editorCommand =>
		driver.post(`${local}/settings`, { settings: editorOf(editorCommand) })
	const localOnly = `${HTTP_UNPROCESSABLE} EDITOR_LOCAL_ONLY`
	await setEditor('')
	const unset = await codeOf(await web(relayed, postJson({ path: 'a.txt' })))
	report.check(
		'no editor set on the machine: a relayed open-editor is EDITOR_LOCAL_ONLY',
		unset === localOnly,
		unset,
	)
	await setEditor('open {file}')
	const opener = await codeOf(await web(relayed, postJson({ path: 'a.txt' })))
	report.check(
		'the OS opener set on the machine: a relayed open-editor is EDITOR_LOCAL_ONLY',
		opener === localOnly,
		opener,
	)
	const outside = path.join(home, 'outside.txt')
	await fs.writeFile(outside, 'not in the repo\n')
	const link = path.join(repo.root, 'outside-link.txt')
	await fs.symlink(outside, link)
	const escaped = await codeOf(
		await web(relayed, postJson({ path: 'outside-link.txt' })),
	)
	await fs.rm(link)
	report.check(
		'a relayed open-editor on a symlink out of the repo is BAD_PATH',
		escaped === `${HTTP_BAD_REQUEST} BAD_PATH`,
		escaped,
	)
	await setEditor('{repo}/code {file}')
	const answer = await driver.post(`${local}/open-editor`, { path: 'a.txt' })
	const placeholder = `${answer.status} ${answer.body.code}`
	report.check(
		'a template whose program is a placeholder is BAD_EDITOR_COMMAND, locally too',
		placeholder === `${HTTP_UNPROCESSABLE} BAD_EDITOR_COMMAND`,
		placeholder,
	)
	await setEditor('')
}

function editorOf(editorCommand) {
	if (!editorCommand) return {}
	return { editorCommand }
}

const NOT_SERVED = `${HTTP_FORBIDDEN} NOT_SERVED`

// The relayed opens a served root does not cover are refused before git runs; a file inside the
// served repo opens, and the machine itself still opens another repository.
async function checkOpens(context) {
	const other = await scratchRepo()
	const outside = path.join(context.home, 'outside.txt')
	await fs.writeFile(outside, 'not in the repo\n')
	const link = path.join(context.repo.root, 'outside-open.txt')
	await fs.symlink(outside, link)
	await checkOpenRefusals(context, { other, outside })
	await fs.rm(link)
	await checkServedOpens(context, other)
}

// Another repository, the filesystem's root, a file outside the repo directly or through a
// symlink, a repo scope outside it, an inventory of another repository: 403 NOT_SERVED. A pr
// open, which would check the PR out on the machine: 403 PR_LOCAL_ONLY.
async function checkOpenRefusals(context, { other, outside }) {
	const { report, repo } = context
	const open = relayedOpen(context)
	const refusals = unservedOpens(repo, { other, outside })
	const answers = await Promise.all(
		refusals.map(({ route, body }) =>
			open(route, { noGuide: true, ...body }),
		),
	)
	refusals.forEach(({ what }, at) => {
		report.check(
			`a relayed open of ${what} is NOT_SERVED`,
			answers[at] === NOT_SERVED,
			answers[at],
		)
	})
	const pr = await open(HUB_PATHS.desks, {
		root: repo.root,
		mode: 'pr',
		target: 'main',
	})
	report.check(
		'a relayed pr open is PR_LOCAL_ONLY',
		pr === `${HTTP_FORBIDDEN} PR_LOCAL_ONLY`,
		pr,
	)
}

// One open the served root does not cover: what it names, its body, its route.
const unserved = (what, body, route = HUB_PATHS.desks) => ({
	what,
	route,
	body,
})

// What a served root does not cover.
function unservedOpens(repo, { other, outside }) {
	return [
		unserved('another repository', { root: other.root }),
		unserved('the filesystem root, in file mode', {
			root: '/',
			mode: 'file',
			target: outside,
		}),
		unserved('a file outside the repo', {
			root: repo.root,
			mode: 'file',
			target: outside,
		}),
		unserved('a symlink out of the repo', {
			root: repo.root,
			mode: 'file',
			target: 'outside-open.txt',
		}),
		unserved('a repo scope outside the repo', {
			root: repo.root,
			path: other.root,
		}),
		unserved(
			'the inventory of another repository',
			{ root: other.root },
			HUB_PATHS.inventory,
		),
	]
}

async function checkServedOpens(context, other) {
	const { report, repo, record, driver } = context
	const web = webOf(context)
	const file = await web(
		HUB_PATHS.desks,
		postJson({
			hubId: record.hubId,
			root: repo.root,
			mode: 'file',
			target: 'a.txt',
			session: 'bridge-check-file',
		}),
	)
	const { desk } = await file.json()
	report.check(
		'a relayed file open inside the served repo opens',
		file.status === HTTP_OK && Boolean(desk?.id),
		String(file.status),
	)
	if (desk?.id)
		await web(`${HUB_PATHS.desks}/${desk.id}`, { method: 'DELETE' })
	const local = await driver.post(HUB_PATHS.desks, {
		root: other.root,
		noGuide: true,
	})
	report.check(
		'the machine itself still opens another repository',
		local.status === HTTP_OK,
		String(local.status),
	)
	if (local.body.desk?.id)
		await driver.json(`${HUB_PATHS.desks}/${local.body.desk.id}`, {
			method: 'DELETE',
		})
}

// An open as the web relays it, named by the hub's web id; its status and failure code.
function relayedOpen(context) {
	const web = webOf(context)
	return async (route, body) =>
		codeOf(
			await web(
				route,
				postJson({ hubId: context.record.hubId, ...body }),
			),
		)
}
