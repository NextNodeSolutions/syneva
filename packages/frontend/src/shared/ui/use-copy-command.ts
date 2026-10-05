import { useRef, useState } from 'react'

import type { RefObject } from 'react'

// How long a confirmed copy holds before the box returns to rest.
const COPIED_MS = 1800

export type CopyState = 'idle' | 'copied' | 'manual'

type CopyCommand = {
	copyState: CopyState
	// The read-only field holding the command, selected for a manual copy.
	fieldRef: RefObject<HTMLInputElement | null>
	copy: () => void
	// The reader left the selected command: the manual-copy note goes.
	release: () => void
}

// Copy a command to the clipboard. A page served over plain http (a hub on a
// LAN address) is not a secure context and has no clipboard: the command is
// then selected in its field for the reader to copy, and stays `manual` until
// they leave it. A copy that worked is `copied` for COPIED_MS. The timer
// starts from the click that asked for the copy, so no effect owns it.
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

// Whether the clipboard took the text. It is missing outside a secure context
// and can refuse (no permission): both mean the reader copies by hand.
async function writeClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}
