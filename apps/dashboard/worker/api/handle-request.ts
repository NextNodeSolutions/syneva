import { AUTH_PATH } from '@syneva/contracts/api'

import { createAuth } from '../auth/create-auth'
import { SourceError } from '../source/source-error'

import { answerAuthenticated } from './answer-authenticated'
import { errorResponse } from './respond'

import type { Authentication } from '../auth/create-auth'
import type { WorkerEnvironment } from '../environment'

const AUTH_ENDPOINTS = new Set([
	'/get-session',
	'/sign-in/email',
	'/sign-up/email',
	'/sign-in/social',
	'/callback/github',
	'/link-social',
	'/list-accounts',
	'/unlink-account',
	'/sign-out',
	'/error',
])
const NOT_FOUND = 404

export async function handleRequest(
	request: Request,
	env: WorkerEnvironment,
): Promise<Response> {
	const { pathname } = new URL(request.url)
	if (pathname === '/healthz') return new Response('ok')
	if (!pathname.startsWith('/api/')) return serveApp(request, env)
	try {
		const auth = createAuth(env)
		if (pathname.startsWith(`${AUTH_PATH}/`))
			return await answerAuth(request, auth, pathname)
		return await answerAuthenticated(request, env, auth)
	} catch (error) {
		if (error instanceof SourceError)
			return errorResponse({ code: error.code, error: error.message })
		return errorResponse({
			code: 'internal_error',
			error: 'Syneva could not complete this request. Retry in a moment.',
		})
	}
}

async function answerAuth(
	request: Request,
	auth: Authentication,
	pathname: string,
): Promise<Response> {
	if (AUTH_ENDPOINTS.has(pathname.slice(AUTH_PATH.length))) {
		const response = await auth.handler(request)
		const headers = new Headers(response.headers)
		headers.set('cache-control', 'no-store')
		return new Response(response.body, { status: response.status, headers })
	}
	return errorResponse({
		code: 'not_found',
		error: 'No API route answers this path.',
	})
}

async function serveApp(
	request: Request,
	env: WorkerEnvironment,
): Promise<Response> {
	const response = await env.ASSETS.fetch(request)
	if (response.status !== NOT_FOUND || request.method !== 'GET')
		return response
	return env.ASSETS.fetch(
		new Request(new URL('/index.html', request.url), request),
	)
}
