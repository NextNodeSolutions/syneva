// What stays the machine's on a paired hub (RFC 0001, section 7): the web account is the trust
// boundary of a relayed request, so the web may review code in the repositories the hub serves
// and nothing more. Its settings writes keep the machine's own keys (contracts/settings.ts).
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { deskApiBase } from '../../packages/contracts/dist/routes.js'

import { HTTP_OK } from './http-wire.mjs'
import { webOf } from './relay-checks.mjs'

// The machine's editor command for these checks; never launched by them.
const MACHINE_EDITOR = 'code -g {file}:{line}'
// A display preference the machine sets, then the web.
const MACHINE_FONT = 13
const WEB_FONT = 15

export async function checkMachine(context, desk) {
	context.report.section("relay: what stays the machine's")
	await checkSettings(context, desk)
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
