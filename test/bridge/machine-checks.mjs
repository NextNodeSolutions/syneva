// What stays the machine's on a paired hub (RFC 0001, section 7): the web account is the trust
// boundary of a relayed request, so the web may review code in the repositories the hub serves
// and nothing more. Its settings writes keep the machine's own keys (contracts/settings.ts), and
// it opens a file only in an editor the machine names, never through the OS's opener. Every
// editor case here is refused before anything is launched.
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { deskApiBase } from '../../packages/contracts/dist/routes.js'

import { HTTP_BAD_REQUEST, HTTP_OK, HTTP_UNPROCESSABLE } from './http-wire.mjs'
import { webOf } from './relay-checks.mjs'

// The machine's editor command for these checks; never launched by them.
const MACHINE_EDITOR = 'code -g {file}:{line}'
// A display preference the machine sets, then the web.
const MACHINE_FONT = 13
const WEB_FONT = 15

export async function checkMachine(context, desk) {
	context.report.section("relay: what stays the machine's")
	await checkSettings(context, desk)
	await checkEditor(context, desk)
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

// The machine sets its editor; the web reads the preferences without it, and its writes (a
// whole preferences body, a body that is no object) change the display preferences and keep it.
async function checkSettings(context, desk) {
	const { report, driver, home } = context
	const web = webOf(context)
	const route = `${deskApiBase(desk.localId)}/settings`
	const relayed = `${deskApiBase(desk.webId)}/settings`
	await driver.post(route, {
		settings: { editorCommand: MACHINE_EDITOR, fontSize: MACHINE_FONT },
		diffStyle: 'split',
	})
	const read = await (await web(relayed)).json()
	report.check(
		'a relayed GET /settings leaves the editor command out',
		read.settings?.fontSize === MACHINE_FONT &&
			!('editorCommand' in read.settings),
		JSON.stringify(read),
	)
	const written = await web(
		relayed,
		postJson({
			settings: { editorCommand: 'subl', fontSize: WEB_FONT },
			diffStyle: 'unified',
		}),
	)
	const kept = await readSettingsFile(home)
	report.check(
		'a relayed POST /settings changes the display preferences, never the editor command',
		written.status === HTTP_OK &&
			kept.settings?.editorCommand === MACHINE_EDITOR &&
			kept.settings.fontSize === WEB_FONT &&
			kept.diffStyle === 'unified',
		JSON.stringify(kept),
	)
	const odd = await web(relayed, postJson(['not', 'preferences']))
	const after = await readSettingsFile(home)
	report.check(
		'a relayed POST /settings that is no object keeps the editor command too',
		odd.status === HTTP_OK &&
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
