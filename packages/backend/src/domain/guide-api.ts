// The API block: the entry points a caller depends on (routes, events, commands), each with its messages' fields and what the change does to them.
import { GUIDE_KEYS } from './guide-keys.js'
import {
	identifier,
	list,
	oneOf,
	onlyKeys,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { parseOptionalRef } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'
import { API_METHODS } from './guide-structure-shapes.js'
import { parseChange, parseFields } from './guide-structures.js'

import type { BlockInput } from './guide-blocks.js'
import type { Parsed } from './guide-parse.js'
import type { BlockScope } from './guide-refs.js'
import type { ExplanationBlock } from './guide-shapes.js'
import type { ApiEndpoint } from './guide-structure-shapes.js'

function parseEndpoint(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<ApiEndpoint> {
	const endpoint = record(raw, where)
	if (!endpoint.ok) return endpoint
	const keys = onlyKeys(endpoint.value, where, GUIDE_KEYS.endpoint)
	if (!keys.ok) return keys
	const { id: rawId, method: rawMethod, path: rawPath } = endpoint.value
	const {
		summary: rawSummary,
		change: rawChange,
		ref: rawRef,
	} = endpoint.value
	const { request: rawRequest, response: rawResponse } = endpoint.value
	const id = identifier(rawId, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const method = oneOf(rawMethod, `${where}.method`, API_METHODS)
	if (!method.ok) return method
	const path = text(rawPath, `${where}.path`, GUIDE_LIMITS.labelChars)
	if (!path.ok) return path
	const summary = optionalText(
		rawSummary,
		`${where}.summary`,
		GUIDE_LIMITS.textChars,
	)
	if (!summary.ok) return summary
	const change = parseChange(rawChange, `${where}.change`)
	if (!change.ok) return change
	const ref = parseOptionalRef(rawRef, `${where}.ref`, scope)
	if (!ref.ok) return ref
	const request = parseFields(rawRequest, `${where}.request`, scope)
	if (!request.ok) return request
	const response = parseFields(rawResponse, `${where}.response`, scope)
	if (!response.ok) return response
	return {
		ok: true,
		value: {
			id: id.value,
			method: method.value,
			path: path.value,
			summary: summary.value,
			change: change.value,
			ref: ref.value,
			request: request.value,
			response: response.value,
		},
	}
}

export function parseApi({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const endpoints = list(
		block.endpoints,
		`${where}.endpoints`,
		{ min: 1, max: GUIDE_LIMITS.endpoints },
		(entry, at) => parseEndpoint(entry, at, scope),
	)
	if (!endpoints.ok) return endpoints
	const unique = uniqueIds(
		endpoints.value.map(endpoint => endpoint.id),
		`${where}.endpoints`,
	)
	if (!unique.ok) return unique
	return {
		ok: true,
		value: { ...base, kind: 'api', endpoints: endpoints.value },
	}
}
