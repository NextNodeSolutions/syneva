import type { HubPlace } from '@entities/hub/hub-place'

// What "Open a desk" says: who runs the command and where (a hub reached over the network is
// on another machine), then what happens once it runs, or once the hub answers again.
const RUN: Record<HubPlace, string> = {
	loopback:
		'Your agent runs this in its repository when it has changes for you, and you can run it there too.',
	network:
		"Your agent runs this in its repository, on the hub's machine, when it has changes for you, and you can run it there too.",
}

const NEXT = 'A new desk shows up here once it opens.'
const NEXT_STALE = 'New desks show up here once the hub answers again.'

export function openSentences(
	place: HubPlace,
	{ isStale }: { isStale: boolean },
): { run: string; next: string } {
	return { run: RUN[place], next: isStale ? NEXT_STALE : NEXT }
}
