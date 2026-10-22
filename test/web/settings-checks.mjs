// A web desk's /settings is the person's preferences in D1, the dashboard's own document: written
// under the desk's web id, read back there and at /api/hub/settings, never relayed, so the paired
// hub's settings.json (where it reads the editor command it runs) is untouched.
import {
	API_PATHS,
	deskApiBase,
	HUB_PATHS,
} from '../../packages/contracts/dist/routes.js'

import { HTTP_NOT_FOUND, HTTP_OK } from './statuses.mjs'

const PREFS = {
	settings: { fontSize: 17, editorCommand: 'code --goto {file}:{line}' },
	diffStyle: 'unified',
}

export async function checkDeskSettings({ report, browser, hub }, deskId) {
	const route = `${deskApiBase(deskId)}${API_PATHS.settings}`
	const before = await localSettings(hub)
	const written = await browser.post(route, PREFS)
	const [desk, account] = await Promise.all([
		browser.json(route),
		browser.json(HUB_PATHS.settings),
	])
	report.check(
		`POST ${route} is written to the account, read back there and at ${HUB_PATHS.settings}`,
		written.status === HTTP_OK &&
			written.body.ok === true &&
			isPrefs(desk.body) &&
			isPrefs(account.body),
		`${written.status} ${JSON.stringify(desk.body)} ${JSON.stringify(account.body)}`,
	)
	const after = await localSettings(hub)
	report.check(
		"the paired hub's own settings are untouched: a desk's /settings is never relayed",
		JSON.stringify(after) === JSON.stringify(before) && !isPrefs(after),
		JSON.stringify(after),
	)
	const odd = await browser.json(
		`${deskApiBase('not-an-id')}${API_PATHS.settings}`,
	)
	report.check(
		'a desk /settings under an id that does not read is 404 NOT_RELAYED',
		odd.status === HTTP_NOT_FOUND && odd.body.code === 'NOT_RELAYED',
		`${odd.status} ${odd.body?.code}`,
	)
}

function isPrefs(body) {
	return (
		body?.diffStyle === PREFS.diffStyle &&
		body.settings?.fontSize === PREFS.settings.fontSize &&
		body.settings.editorCommand === PREFS.settings.editorCommand
	)
}

// The local hub's own preferences, read on its loopback port.
async function localSettings(hub) {
	const response = await fetch(new URL(HUB_PATHS.settings, hub.url))
	return response.json()
}
