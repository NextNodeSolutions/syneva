import { DecodeError } from '@shared/api/decode'

import type { decodeGuide } from './decode'
import type { decodeGuideResolution } from './decode-resolution'

type GuideDecoders = {
	decodeGuide: typeof decodeGuide
	decodeGuideResolution: typeof decodeGuideResolution
}

let loaded: GuideDecoders | null = null

// The guide's decoders ride their own chunk: a desk without a guide never pays for them, a guided one loads them with its first state fetch. The API boundary awaits this before any synchronous decode that may meet a guide.
export async function ensureGuideDecoders(raw: unknown): Promise<void> {
	if (loaded || !carriesGuide(raw)) return
	const [guide, resolution] = await Promise.all([
		import('./decode'),
		import('./decode-resolution'),
	])
	loaded = {
		decodeGuide: guide.decodeGuide,
		decodeGuideResolution: resolution.decodeGuideResolution,
	}
}

function carriesGuide(raw: unknown): boolean {
	if (typeof raw !== 'object' || raw === null) return false
	return 'guide' in raw && !!raw.guide
}

export function guideDecoders(endpoint: string): GuideDecoders {
	if (!loaded)
		throw new DecodeError(
			'guide decoders were not loaded before decoding',
			endpoint,
		)
	return loaded
}
