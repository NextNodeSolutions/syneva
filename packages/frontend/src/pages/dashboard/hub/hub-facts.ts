import { hubPlace } from '@entities/hub/hub-place'

import { relativeTime } from '../format'

import type { HubHealth } from '@entities/hub/model'

const STARTED = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

// The hub's health as facts a reviewer can check: where it answers, what it runs, since when,
// and who it lets in.
export function hubFacts(
	health: HubHealth,
	now: number,
): { key: string; value: string }[] {
	const isLocal = hubPlace() === 'loopback'
	return [
		{ key: 'Address', value: window.location.host },
		{
			key: 'Where',
			value: isLocal
				? 'This machine (loopback)'
				: 'Reached over the network',
		},
		{ key: 'Version', value: health.version },
		{
			key: 'Running since',
			value: `${STARTED.format(new Date(health.startedAt))} (${relativeTime(health.startedAt, now)})`,
		},
		{
			key: 'Access',
			value: health.keyRequired
				? 'An access key is required'
				: 'Open to this machine only',
		},
		{ key: 'Instance', value: health.instanceId },
	]
}
