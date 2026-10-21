// The ops routes as control-center's budget agent calls them (RFC 0001, 6.5): a Bearer OPS_TOKEN,
// or none, or a wrong one.
import { BRIDGE_PATHS } from '../../../packages/contracts/dist/bridge.js'

export function opsOf({ web, secrets }) {
	const call = async (route, init, token) => {
		const headers = { 'content-type': 'application/json' }
		if (token !== null) headers.authorization = `Bearer ${token}`
		const response = await fetch(new URL(route, web.origin), {
			...init,
			headers,
		})
		const text = await response.text()
		return { status: response.status, body: parsed(text) }
	}
	return {
		hasToken: Boolean(secrets.OPS_TOKEN),
		status: (token = secrets.OPS_TOKEN) =>
			call(BRIDGE_PATHS.opsStatus, { method: 'GET' }, token),
		breaker: (body, token = secrets.OPS_TOKEN) =>
			call(
				BRIDGE_PATHS.opsBreaker,
				{ method: 'POST', body: JSON.stringify(body) },
				token,
			),
	}
}

function parsed(text) {
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}
