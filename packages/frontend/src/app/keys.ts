import { cmd, enter } from '@app/hotkey-matchers'
import { HOTKEYS_APP, HOTKEYS_NOTES } from '@app/hotkeys-app'
import { HOTKEYS_DIFF } from '@app/hotkeys-diff'
import { confirmYes } from '@widgets/dialogs/confirm'
import { golineCancel } from '@widgets/diff-view/cursor-goline'
import { isInRail } from '@widgets/hub-shell/rail-hook'

import { S } from './store'

import type { Group, Hotkey } from '@app/hotkey-matchers'

// One ordered table is the single source of truth: the dispatcher runs the first binding whose key matches and whose scope is active, and the ? overlay renders from the same table, so hints can never drift from behavior.
// Entries live in scope segments for size, and the order is part of the contract: modal keys first (⌘↵ sends while the Send modal is up even with a composer behind it), then the notes panel (an open panel owns the arrows and Enter over the diff's).
const HOTKEYS_MODAL: Hotkey[] = [
	{
		combo: '↵',
		desc: 'Confirm',
		group: 'App',
		test: enter,
		when: () => !!S.confirmMsg,
		run: confirmYes,
		hide: true,
	},
	{
		combo: '⌘↵',
		desc: 'Send to agent',
		group: 'App',
		test: cmd('Enter'),
		when: () => S.sendOpen,
		typing: true,
		run: () => S.sendConfirm?.(),
		hide: true,
	},
]

const HOTKEYS: Hotkey[] = [
	...HOTKEYS_MODAL,
	...HOTKEYS_NOTES,
	...HOTKEYS_DIFF,
	...HOTKEYS_APP,
]

function isTyping(e: KeyboardEvent): boolean {
	const { target } = e
	if (!(target instanceof HTMLElement)) return false
	return (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.isContentEditable
	)
}

export function installKeys(): void {
	document.addEventListener('keydown', e => {
		if (S.deskClosed) return
		// A key pressed inside the hub's rail is the rail's: Enter follows its link.
		if (isInRail(e.target)) return
		const typing = isTyping(e)
		for (const h of HOTKEYS) {
			if (!h.test(e)) continue
			if (typing && !h.typing) continue
			if (h.when && !h.when()) continue
			// Any other action abandons pending goline digits - otherwise the idle timer would yank the cursor away ~800ms after a j/⇧Y that already moved on.
			if (!h.goline) golineCancel()
			e.preventDefault()
			h.run(e)
			return
		}
	})
}

export function helpGroups(): {
	group: Group
	items: { combo: string; desc: string }[]
}[] {
	const order: Group[] = ['Navigate', 'Review', 'Comment', 'View', 'App']
	return order.map(group => ({
		group,
		items: HOTKEYS.filter(h => h.group === group && !h.hide).map(h => ({
			combo: h.combo,
			desc: h.desc,
		})),
	}))
}
