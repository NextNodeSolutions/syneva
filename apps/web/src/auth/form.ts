// A small body a page's form or a script posts: JSON when it says so, else form-encoded. The
// fields as strings (anything else reads as absent), under a cap.
import { readText } from '../http/body.js'

export type Posted =
	| { fields: Map<string, string>; isJson: boolean }
	| { refusal: Response }

const FORM_BODY_BYTES = 4096

export async function readPosted(request: Request): Promise<Posted> {
	const read = await readText(request, FORM_BODY_BYTES)
	if ('refusal' in read) return read
	const isJson = (request.headers.get('content-type') ?? '').includes(
		'application/json',
	)
	if (!isJson)
		return { fields: new Map(new URLSearchParams(read.text)), isJson }
	return { fields: jsonFields(read.text), isJson }
}

function jsonFields(text: string): Map<string, string> {
	let parsed: unknown = null
	try {
		parsed = JSON.parse(text)
	} catch {
		return new Map()
	}
	if (typeof parsed !== 'object' || parsed === null) return new Map()
	return new Map(
		Object.entries(parsed).flatMap(([name, field]: [string, unknown]) =>
			fieldText(name, field),
		),
	)
}

// A JSON field as the form would have sent it: a string as is, a boolean as "1" or "0".
function fieldText(name: string, field: unknown): [string, string][] {
	if (typeof field === 'string') return [[name, field]]
	if (typeof field === 'boolean') return [[name, field ? '1' : '0']]
	return []
}
