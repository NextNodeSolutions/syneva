// What makes an approval the person's own act on the device page: its Approve carries a proof
// bound to the session and the code, HMAC(SESSION_SECRET, purpose, the session's digest, the code),
// which only a device page rendered for this session holds. So no approval pairs a hub before the
// person has seen the page that names the account it pairs to and the hub (its name, its CLI
// version); a script holding the cookie, or a POST built without the page, approves nothing.
import { hmacHex, isSameSecret } from './secrets.js'

import type { Session } from './session.js'

// Keeps the proof apart from every other HMAC the secret signs (the session ids).
const PURPOSE = 'syneva-device-approval'

export function approvalProof(
	env: Env,
	session: Session,
	userCode: string,
): Promise<string> {
	return hmacHex(
		env.SESSION_SECRET,
		`${PURPOSE}\n${session.digest}\n${userCode}`,
	)
}

// Constant time, as every presented secret is compared.
export async function isApprovalProof(
	env: Env,
	{ session, userCode }: { session: Session; userCode: string },
	presented: string,
): Promise<boolean> {
	return isSameSecret(presented, await approvalProof(env, session, userCode))
}
