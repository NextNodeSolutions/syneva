import { useRef, useState } from 'react'

import { fetchPlanVersion } from '@entities/hub/api'
import { Notice } from '@shared/ui/notice'
import { TextButton } from '@shared/ui/text-button'
import * as stylex from '@stylexjs/stylex'

import { planPage } from './plan-page.styles'

import type { ReactElement } from 'react'

type Older = { number: number; markdown: string }

// A posted version never changes, so each is read from the hub once a page life, whichever
// plan page asks again.
const olderVersions = new Map<string, string>()

// An earlier version is read on request and held while the reviewer stays on it; the latest
// is the plan's own, followed from the hub. Only the last choice lands: a slow read the
// reviewer has since moved on from is dropped. Choosing the latest steps back to it directly.
export function useOlderVersion(
	id: string,
	latest: number,
): {
	older: Older | null
	choose: (version: number) => void
	back: () => void
} {
	const [older, setOlder] = useState<Older | null>(null)
	const lastAsked = useRef(0)
	const back = (): void => {
		lastAsked.current += 1
		setOlder(null)
	}
	const read = async (version: number): Promise<void> => {
		lastAsked.current += 1
		const asked = lastAsked.current
		const key = `${id}@${String(version)}`
		try {
			const markdown =
				olderVersions.get(key) ?? (await fetchPlanVersion(id, version))
			olderVersions.set(key, markdown)
			if (asked === lastAsked.current)
				setOlder({ number: version, markdown })
		} catch {
			if (asked === lastAsked.current) setOlder(null)
		}
	}
	const choose = (version: number): void => {
		if (version === latest) back()
		else void read(version)
	}
	return { older, choose, back }
}

export function OlderNotice({
	older,
	latest,
	onBack,
}: {
	older: Older
	latest: number
	onBack: () => void
}): ReactElement {
	return (
		<div {...stylex.props(planPage.notice)}>
			<Notice
				tone="amber"
				rule="amber"
				role="status"
				lead={`You are reading version ${String(older.number)} of ${String(latest)}.`}
			>
				<TextButton onClick={onBack}>Back to the latest</TextButton>
			</Notice>
		</div>
	)
}
