// What a `pulse` frame must agree with: GET /api/desks/<id>/pulse read at the same moment. A whole
// pulse is that answer; a partial one is its head (the fields below, the contract's DeskPulseHead)
// and a digest, with none of the parts the head leaves out.
import { isDeepStrictEqual } from 'node:util'

export const HEAD_FIELDS = [
	'baseDiffHash',
	'guideExpected',
	'serverInstanceId',
	'agentActivity',
	'agentListening',
	'queuedQuestions',
	'queuedReviews',
]

export function isPartial(pulse) {
	return typeof pulse?.partial?.digest === 'string'
}

// The head of a pulse, as JSON reads it: an absent field stays absent.
export function headOf(pulse) {
	return Object.fromEntries(
		HEAD_FIELDS.filter(field => pulse[field] !== undefined).map(field => [
			field,
			pulse[field],
		]),
	)
}

export function readPulse(driver, deskId) {
	return driver.json(`/api/desks/${deskId}/pulse`)
}

// Whether the frame's pulse is the route's: whole, or its head with only `partial` beside it.
export function agreesWithRoute(pulse, whole) {
	if (!isPartial(pulse)) return isDeepStrictEqual(pulse, whole)
	const { partial, ...head } = pulse
	return (
		Object.keys(partial).length === 1 &&
		isDeepStrictEqual(head, headOf(whole))
	)
}
