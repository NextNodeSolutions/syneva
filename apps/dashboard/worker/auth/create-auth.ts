import { MIN_PASSWORD_LENGTH } from '@syneva/contracts/auth'
import { betterAuth } from 'better-auth'

import type { BetterAuthOptions } from 'better-auth'
import type { WorkerEnvironment } from '../environment'

export function createAuth(env: WorkerEnvironment): Authentication {
	return betterAuth<BetterAuthOptions>({
		appName: 'Syneva',
		baseURL: env.SITE_URL,
		secret: env.BETTER_AUTH_SECRET,
		database: env.DB,
		trustedOrigins: [env.SITE_URL],
		emailAndPassword: {
			enabled: true,
			minPasswordLength: MIN_PASSWORD_LENGTH,
		},
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		account: {
			encryptOAuthTokens: true,
			accountLinking: {
				enabled: true,
				disableImplicitLinking: true,
				allowDifferentEmails: true,
			},
		},
		rateLimit: { enabled: true, storage: 'database' },
		advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
		logger: { disabled: true },
	})
}

export type Authentication = ReturnType<typeof betterAuth<BetterAuthOptions>>
