// A stand-in for Cloudflare's edge in front of `wrangler dev`, for T10's local drill (RFC 0001,
// 6.5, the edge stage): it passes every request and upgrade through to the Worker, spelled with
// the web's own Host and Origin (the real edge serves the same hostname, so it changes neither),
// and while its rule is up answers every request but /bridge/v1/ops/* itself, before the Worker
// sees it, as the WAF block rule does. The real rule answers 403; this one answers what
// `statusOf(label)` says for the client that asks (its `x-cost-client`, which the browser tab's
// stand-ins send and nothing forwards), so each refusal 4.3 names - 403, 429, 503 - meets a client.
import http from 'node:http'
import net from 'node:net'

const OPS_PREFIX = '/bridge/v1/ops/'
const CLIENT_HEADER = 'x-cost-client'

export async function startEdge({ port, target }) {
	const web = new URL(target)
	const upgraded = new Set()
	const refused = []
	let statusOf = null
	const isBlocked = request =>
		statusOf !== null && !request.url.startsWith(OPS_PREFIX)
	const refusal = request => {
		const label = request.headers[CLIENT_HEADER] ?? null
		const status = statusOf(label)
		refused.push({ at: Date.now(), label, path: request.url, status })
		return status
	}
	const server = http.createServer((request, response) => {
		if (isBlocked(request)) {
			response.writeHead(refusal(request), { 'content-length': '0' })
			response.end()
			return
		}
		const upstream = http.request(
			{
				host: web.hostname,
				port: web.port,
				method: request.method,
				path: request.url,
				headers: forwarded(request.rawHeaders, web),
			},
			answer => {
				response.writeHead(answer.statusCode, answer.rawHeaders)
				answer.pipe(response)
			},
		)
		upstream.on('error', () => {
			response.destroy()
		})
		request.pipe(upstream)
	})
	server.on('upgrade', (request, socket, head) => {
		upgraded.add(socket)
		socket.on('close', () => {
			upgraded.delete(socket)
		})
		if (isBlocked(request)) {
			const status = refusal(request)
			socket.end(
				`HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\ncontent-length: 0\r\nconnection: close\r\n\r\n`,
			)
			return
		}
		const upstream = net.connect(Number(web.port), web.hostname, () => {
			const headers = forwarded(request.rawHeaders, web)
			const lines = [`${request.method} ${request.url} HTTP/1.1`]
			for (let at = 0; at < headers.length; at += 2)
				lines.push(`${headers[at]}: ${headers[at + 1]}`)
			upstream.write(`${lines.join('\r\n')}\r\n\r\n`)
			if (head.length) upstream.write(head)
			upstream.pipe(socket)
			socket.pipe(upstream)
		})
		upstream.on('error', () => {
			socket.destroy()
		})
		socket.on('error', () => {
			upstream.destroy()
		})
	})
	await new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(port, '127.0.0.1', resolve)
	})
	return {
		origin: `http://127.0.0.1:${port}`,
		// What the rule answered while it was up: { at, label, path, status }.
		refused,
		block(chooser) {
			statusOf = chooser
		},
		unblock() {
			statusOf = null
		},
		async stop() {
			for (const socket of upgraded) socket.destroy()
			server.closeAllConnections()
			await new Promise(resolve => {
				server.close(resolve)
			})
		},
	}
}

// The request's headers as the Worker would get them through the real edge: Host and Origin are
// the web's own, the test's label is dropped.
function forwarded(rawHeaders, web) {
	const headers = []
	for (let at = 0; at < rawHeaders.length; at += 2) {
		const name = rawHeaders[at]
		const lower = name.toLowerCase()
		if (lower === CLIENT_HEADER) continue
		if (lower === 'host') headers.push(name, web.host)
		else if (lower === 'origin') headers.push(name, web.origin)
		else headers.push(name, rawHeaders[at + 1])
	}
	return headers
}
