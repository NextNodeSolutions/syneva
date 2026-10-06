import { useRef, useState } from 'react'

import type { RefObject } from 'react'

const COPIED_MS = 1800

export type CopyState = 'idle' | 'copied' | 'manual'

type CopyCommand = {
	copyState: CopyState
	fieldRef: RefObject<HTMLInputElement | null>
	copy: () => void
	release: () => void
}

// A page served over plain http (a hub on a LAN address) is not a secure context and has no
// clipboard: the command is then selected in its field for manual copy and stays `manual` until the
// reader leaves it; the timer starts from the click that asked for the copy, so no effect owns it.
export function useCopyCommand(command: string): CopyCommand {
	const [copyState, setCopyState] = useState<CopyState>('idle')
	const fieldRef = useRef<HTMLInputElement>(null)
	const resetTimer = useRef<number | undefined>(undefined)
	const copy = async (): Promise<void> => {
		window.clearTimeout(resetTimer.current)
		if (await writeClipboard(command)) {
			setCopyState('copied')
			resetTimer.current = window.setTimeout(
				() => setCopyState('idle'),
				COPIED_MS,
			)
			return
		}
		fieldRef.current?.focus()
		fieldRef.current?.select()
		setCopyState('manual')
	}
	return {
		copyState,
		fieldRef,
		copy: () => void copy(),
		release: () => {
			if (copyState === 'manual') setCopyState('idle')
		},
	}
}

async function writeClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}
