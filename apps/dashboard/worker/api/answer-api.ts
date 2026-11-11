import { API_ROUTES } from '@syneva/contracts/api'
import { matchPath } from '@syneva/contracts/paths'
import { fullName, reviewRefSchema } from '@syneva/contracts/projects'

import { listProjects } from '../reviews/list-projects'

import { errorResponse, jsonResponse } from './respond'

import type { ReviewSource } from '../source/review-source'

const READ_METHOD = 'GET'

export async function answerApi(
	request: Request,
	source: ReviewSource,
): Promise<Response> {
	if (request.method !== READ_METHOD)
		return errorResponse(
			{
				code: 'method_not_allowed',
				error: `The API is read-only: ${request.method} is not allowed.`,
			},
			{ allow: READ_METHOD },
		)
	const { pathname } = new URL(request.url)
	if (pathname === API_ROUTES.projects)
		return jsonResponse(await listProjects(source))
	const reviewParams = matchPath(API_ROUTES.review, pathname)
	if (reviewParams) return answerReview(reviewParams, source)
	return errorResponse({
		code: 'not_found',
		error: `No API route answers ${pathname}.`,
	})
}

async function answerReview(
	params: Readonly<Record<string, string>>,
	source: ReviewSource,
): Promise<Response> {
	const ref = reviewRefSchema.safeParse(params)
	if (!ref.success)
		return errorResponse({
			code: 'not_found',
			error: 'This path names no pull request.',
		})
	const review = await source.readReview(ref.data)
	if (review) return jsonResponse(review)
	return errorResponse({
		code: 'not_found',
		error: `No open pull request #${ref.data.number} in ${fullName(ref.data)}.`,
	})
}
