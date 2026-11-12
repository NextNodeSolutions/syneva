import { SourceError } from '../source/source-error'

import type { Authentication } from './create-auth'

export async function githubToken(
	auth: Authentication,
	headers: Headers,
): Promise<string | null> {
	const accounts = await auth.api.listUserAccounts({ headers })
	const account = accounts.find(link => link.providerId === 'github')
	if (!account) return null
	try {
		const tokens = await auth.api.getAccessToken({
			body: { accountId: account.id },
			headers,
		})
		return tokens.accessToken
	} catch {
		throw new SourceError(
			'github_reconnect',
			'Reconnect GitHub in Settings to renew repository access.',
		)
	}
}
