import { useState } from 'react'

import { signIn, signUp } from '@shared/auth/client'
import { useMutation } from '@tanstack/react-query'

import type { UseMutationResult } from '@tanstack/react-query'

type EmailAuthentication = {
	isCreating: boolean
	authentication: UseMutationResult<void, Error, FormData>
	switchMode: () => void
}

export function useEmailAuthentication(
	onSignedIn: () => Promise<void>,
): EmailAuthentication {
	const [isCreating, setCreating] = useState(false)
	const authentication = useMutation({
		mutationFn: async (fields: FormData) => {
			const credentials = {
				email: textField(fields, 'email'),
				password: textField(fields, 'password'),
			}
			if (!isCreating) return signIn(credentials)
			return signUp({ ...credentials, name: textField(fields, 'name') })
		},
		onSuccess: onSignedIn,
	})
	return {
		isCreating,
		authentication,
		switchMode: () => {
			setCreating(!isCreating)
			authentication.reset()
		},
	}
}

function textField(fields: FormData, name: string): string {
	const entry = fields.get(name)
	if (typeof entry === 'string') return entry
	throw new Error('Complete the form before submitting.')
}
