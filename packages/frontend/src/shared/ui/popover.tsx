import {
	useCallback,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

import { useDismiss } from '@shared/lib/use-dismiss'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { PopoverPanel } from './popover-panel'
import { popover } from './popover.styles'

import type { DismissCause } from '@shared/lib/use-dismiss'
import type { ReactElement, ReactNode, RefObject } from 'react'
import type { Placement } from './popover-panel'

const GAP = 6
const EDGE = 12

// Where the panel opens, as offsets from its trigger (it moves with the page when the page
// scrolls): under the trigger, its left edge on the trigger's, or its right edge on the
// trigger's when it would run past the window; held 12px inside the window either way. Its
// width is measured, so it lines up with the trigger whatever it holds.
function placeUnder(trigger: HTMLElement, width: number): Placement {
	const box = trigger.getBoundingClientRect()
	const isRoomRight = box.left + width + EDGE <= window.innerWidth
	const wanted = isRoomRight ? box.left : box.right - width
	const held = Math.max(
		EDGE,
		Math.min(wanted, window.innerWidth - EDGE - width),
	)
	return { top: box.height + GAP, left: held - box.left }
}

type PopoverProps = {
	// The trigger's face (its icon and words), whether its panel holds a choice in force, and
	// its id when focus must be able to come back to it.
	trigger: { face: ReactNode; isActive: boolean; id?: string | undefined }
	// The panel's accessible name.
	label: string
	children: ReactNode
}

type PopoverState = {
	place: Placement | null
	triggerRef: RefObject<HTMLButtonElement | null>
	panelRef: RefObject<HTMLDivElement | null>
	toggle: (trigger: HTMLElement) => void
}

// Where the panel is open (null while closed), and what opens and closes it: Escape, a press
// or focus outside, or a resize close it, Escape handing focus back to the trigger. Opened, it
// first lays out under the trigger, is measured and placed before it paints, then hands focus
// to its first control.
function usePopover(): PopoverState {
	const [place, setPlace] = useState<Placement | null>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const parts = useMemo(() => [triggerRef, panelRef], [])
	const isOpen = place !== null
	const dismiss = useCallback((cause: DismissCause) => {
		setPlace(null)
		if (cause === 'escape') triggerRef.current?.focus()
	}, [])
	useDismiss({ isOpen, parts, onDismiss: dismiss })
	useLayoutEffect(() => {
		const trigger = triggerRef.current
		const panel = panelRef.current
		if (!isOpen || !trigger || !panel) return
		setPlace(placeUnder(trigger, panel.offsetWidth))
		panel.querySelector<HTMLElement>('button, input, a')?.focus()
	}, [isOpen])
	const toggle = (trigger: HTMLElement): void => {
		if (isOpen) dismiss('outside')
		else setPlace({ top: trigger.offsetHeight + GAP, left: 0 })
	}
	return { place, triggerRef, panelRef, toggle }
}

// A trigger and the panel it opens: Display and Filter, Linear's two controls over a view.
// The panel hangs from its trigger, so it stays with it when the page scrolls. It is a group
// of controls, not a menu: Tab moves through it, and leaving it closes it.
export function Popover({
	trigger,
	label,
	children,
}: PopoverProps): ReactElement {
	const { place, triggerRef, panelRef, toggle } = usePopover()
	const panelId = useId()
	const isOpen = place !== null
	return (
		<div {...stylex.props(popover.anchor)}>
			<button
				ref={triggerRef}
				id={trigger.id}
				type="button"
				aria-expanded={isOpen}
				aria-controls={isOpen ? panelId : undefined}
				onClick={event => toggle(event.currentTarget)}
				{...stylex.props(
					press.control,
					control.base,
					control.outlined,
					control.small,
					(isOpen || trigger.isActive) && popover.triggerOn,
				)}
			>
				{trigger.face}
			</button>
			{place && (
				<PopoverPanel
					id={panelId}
					label={label}
					place={place}
					panelRef={panelRef}
				>
					{children}
				</PopoverPanel>
			)}
		</div>
	)
}
