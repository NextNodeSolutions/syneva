import type { HubStatus } from '@entities/hub/use-hub'
import type { DotTone } from '@shared/ui/live-dot'

// How the hub last answered, as the shell says it: the square's tone, whether it pulses (a
// live hub only), and the word beside it.
export const HUB_STATE: Record<
	HubStatus,
	{ tone: DotTone; isLive: boolean; word: string }
> = {
	connecting: { tone: 'neutral', isLive: false, word: 'Connecting…' },
	live: { tone: 'signal', isLive: true, word: 'Live' },
	unreachable: { tone: 'red', isLive: false, word: 'Not answering' },
	'signed-out': { tone: 'neutral', isLive: false, word: 'Signed out' },
}
