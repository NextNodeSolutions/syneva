// What the device page shows for a code, for its GET and for its POST's answers: the states a code
// is in, the confirmation with its approval proof, and the page around them, which always names
// the signed-in account.
import { html } from '../http/answer.js'
import { iso } from '../http/call.js'
import { HTTP_OK } from '../http/status.js'
import { devicePage } from '../pages/device.js'

import { approvalProof } from './approval-proof.js'
import { displayedUserCode } from './secrets.js'

import type { DeviceCode } from '../db/device-codes.js'
import type { DeviceState } from '../pages/device.js'
import type { Session } from './session.js'

export const CODE_SHAPE = 'A code is eight letters and digits, as XXXX-XXXX.'
export const UNKNOWN_CODE =
	'No hub asks with this code. Check it against your terminal, or run `syneva login` again.'

// The page that asks the person, its Approve carrying the proof for this session and this code.
export async function confirmState(
	env: Env,
	{ session, code }: { session: Session; code: DeviceCode },
	error?: string,
): Promise<DeviceState> {
	return {
		kind: 'confirm',
		userCode: displayedUserCode(code.userCode),
		hubName: code.hubName,
		hubVersion: code.hubVersion,
		proof: await approvalProof(env, session, code.userCode),
		error,
	}
}

// Why a code no longer pairs anything; null while it is open.
export function closedReason(code: DeviceCode, now: Date): string | null {
	if (code.approvedAt) return 'It was approved already: its hub is paired.'
	if (code.deniedAt)
		return 'It was denied: run `syneva login` again to pair this hub.'
	if (code.expiresAt <= iso(now))
		return 'It expired (a code lives ten minutes): run `syneva login` again.'
	return null
}

export function devicePageOf(
	state: DeviceState,
	session: Session,
	status = HTTP_OK,
): Promise<Response> {
	return html(status, devicePage(state, session.email))
}
