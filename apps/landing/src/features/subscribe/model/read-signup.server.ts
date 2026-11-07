import { pickAgents } from './agents'
import { AGENT_FIELD, EMAIL_FIELD, NAME_FIELD, TRAP_FIELD } from './endpoint'
import { cleanName, isEmail, isName } from './signup'

import type { Signup } from './signup'

// Three short fields and a few ticks, multipart included, sit well under it.
const MAX_BODY_BYTES = 4096

// The body as it streams in, failing once it outgrows the cap.
// Measured on the bytes themselves: a Content-Length header is optional, and a client can leave it out.
function capped(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	let received = 0
	return body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				received += chunk.byteLength
				if (received > MAX_BODY_BYTES)
					controller.error(new RangeError('signup body over the cap'))
				else controller.enqueue(chunk)
			},
		}),
	)
}

export async function readForm(
	request: Request,
): Promise<FormData | undefined> {
	if (!request.body) return undefined
	const contentType = request.headers.get('content-type') ?? ''
	try {
		return await new Response(capped(request.body), {
			headers: { 'content-type': contentType },
		}).formData()
	} catch {
		return undefined
	}
}

export const isTrapped = (form: FormData): boolean =>
	Boolean(form.get(TRAP_FIELD))

const textOf = (form: FormData, field: string): string => {
	const submitted = form.get(field)
	return typeof submitted === 'string' ? submitted : ''
}

// Only the address can refuse a signup: a name the form could not have sent is dropped, not answered with an error about the email.
export function signupOf(form: FormData): Signup | undefined {
	const email = textOf(form, EMAIL_FIELD).trim()
	if (!isEmail(email)) return undefined
	const name = cleanName(textOf(form, NAME_FIELD))
	return {
		email,
		name: isName(name) ? name : '',
		agents: pickAgents(form.getAll(AGENT_FIELD)),
	}
}
