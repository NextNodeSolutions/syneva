import { AUTH_PATH } from '@syneva/contracts/api'
import { createAuthClient } from 'better-auth/client'

const client = createAuthClient({ basePath: AUTH_PATH })

type Credentials = { email: string; password: string }

export async function readSession(): Promise<
	typeof client.$Infer.Session | null
> {
	const response = await client.getSession()
	if (response.error)
		throw new Error(
			response.error.message ??
				'Could not check your session. Refresh to retry.',
		)
	return response.data
}

export async function signIn(credentials: Credentials): Promise<void> {
	const response = await client.signIn.email(credentials)
	if (response.error)
		throw new Error(
			response.error.message ??
				'Could not sign in. Check your email and password.',
		)
}

export async function signUp(
	credentials: Credentials & { name: string },
): Promise<void> {
	const response = await client.signUp.email(credentials)
	if (response.error)
		throw new Error(
			response.error.message ??
				'Could not create your account. Try another email.',
		)
}

export async function signOut(): Promise<void> {
	const response = await client.signOut()
	if (response.error)
		throw new Error('Could not sign out. Retry in a moment.')
}

export async function signInGithub(): Promise<void> {
	const response = await client.signIn.social({
		provider: 'github',
		callbackURL: '/settings',
		errorCallbackURL: '/?error=github',
	})
	if (response.error)
		throw new Error(
			response.error.message ??
				'GitHub sign-in failed. Retry in a moment.',
		)
}

export async function linkGithub(): Promise<void> {
	const response = await client.linkSocial({
		provider: 'github',
		callbackURL: '/settings',
		errorCallbackURL: '/settings?error=github',
	})
	if (response.error)
		throw new Error(
			response.error.message ??
				'GitHub could not be connected. Retry in a moment.',
		)
}
