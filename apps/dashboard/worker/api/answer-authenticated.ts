import { API_ROUTES } from '@syneva/contracts/api'
import { projectSelectionSchema } from '@syneva/contracts/github'

import { githubToken } from '../auth/github-token'
import { selectProjects } from '../reviews/select-projects'
import { createGithubClient } from '../source/github/github-client'
import {
	installUrl,
	readGithubConnection,
} from '../source/github/github-connection'
import { createGithubSource } from '../source/github/github-source'
import { createProjectSelection } from '../source/project-selection'
import { SourceError } from '../source/source-error'

import { answerApi } from './answer-api'
import { errorResponse, jsonResponse } from './respond'

import type { Authentication } from '../auth/create-auth'
import type { WorkerEnvironment } from '../environment'

const MAX_BODY_BYTES = 16_384

export async function answerAuthenticated(
	request: Request,
	env: WorkerEnvironment,
	auth: Authentication,
): Promise<Response> {
	const { pathname } = new URL(request.url)
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session)
		return errorResponse({
			code: 'unauthorized',
			error: 'Sign in to Syneva to continue.',
		})
	const token = await githubToken(auth, request.headers)
	if (!token) return unlinkedResponse(request, env.GITHUB_APP_SLUG)
	const client = createGithubClient(token)
	const selection = createProjectSelection(env.DB, session.user.id)
	const connection = await readGithubConnection(
		client,
		env.GITHUB_APP_SLUG,
		await selection.read(),
	)
	if (pathname === API_ROUTES.githubConnection && request.method === 'GET')
		return jsonResponse(connection)
	if (pathname !== API_ROUTES.githubProjects || request.method !== 'PUT')
		return answerApi(
			request,
			createGithubSource(client, connection.repositories),
		)
	const input = await selectionInput(request, env.SITE_URL)
	await selectProjects(connection, selection, input.repositoryIds)
	return jsonResponse({ saved: true })
}

async function selectionInput(
	request: Request,
	origin: string,
): Promise<{ repositoryIds: number[] }> {
	if (request.headers.get('origin') !== new URL(origin).origin)
		throw new SourceError('forbidden', 'Save project settings from Syneva.')
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		throw new SourceError(
			'invalid_request',
			'Send project settings as JSON.',
		)
	const content = await request.text()
	if (new TextEncoder().encode(content).length > MAX_BODY_BYTES)
		throw new SourceError(
			'invalid_request',
			'Select fewer repositories per request.',
		)
	try {
		return projectSelectionSchema.parse(JSON.parse(content))
	} catch {
		throw new SourceError(
			'invalid_request',
			'Choose valid GitHub repository IDs.',
		)
	}
}

function unlinkedResponse(request: Request, slug: string): Response {
	const { pathname } = new URL(request.url)
	if (request.method !== 'GET')
		return errorResponse({
			code: 'github_reconnect',
			error: 'Connect GitHub in Settings to access pull requests.',
		})
	if (pathname === API_ROUTES.githubConnection)
		return jsonResponse({
			isLinked: false,
			installUrl: installUrl(slug),
			installations: [],
			repositories: [],
		})
	if (pathname === API_ROUTES.projects) return jsonResponse({ projects: [] })
	return errorResponse({
		code: 'github_reconnect',
		error: 'Connect GitHub in Settings to access pull requests.',
	})
}
