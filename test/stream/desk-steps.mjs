// What the checks of one desk of their own do to it: open it with the CLI, post to its API.
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

const HTTP_OK = 200

// Opens a desk on the scratch repo (no guide) and hands back its listing line.
export async function openDesk(driver, repo, session) {
	const open = ['open', '--no-open', '--no-guide', '--session', session]
	const { code } = await driver.cli(open, repo.root)
	if (code !== 0) throw new Error(`syneva open exited ${code}`)
	const { body } = await driver.json(HUB_PATHS.desks)
	const desk = body.desks.find(
		each => each.root === repo.root && each.session === session,
	)
	if (!desk) throw new Error(`the desk ${session} is not listed`)
	return desk
}

export async function deskPost(driver, deskId, route, body) {
	const { status } = await driver.post(`/api/desks/${deskId}/${route}`, body)
	if (status !== HTTP_OK) throw new Error(`POST /${route} answered ${status}`)
}

// An agent's comment on the scratch repo's changed line.
export function comment(driver, deskId, body) {
	return deskPost(driver, deskId, 'comment', {
		path: 'a.txt',
		lineNumber: 2,
		body,
	})
}
