import { useSyncExternalStore } from 'react'

import {
	getFieldVersion,
	getStoreVersion,
	subscribeStore,
	subscribeStoreFields,
} from './reactive'

export function useStoreVersion(): void {
	useSyncExternalStore(subscribeStore, getStoreVersion)
}

export function useStoreFields(...fields: string[]): void {
	useSyncExternalStore(
		listener => subscribeStoreFields(fields, listener),
		() => fields.reduce((sum, field) => sum + getFieldVersion(field), 0),
	)
}
