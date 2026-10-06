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

// Below the trigger, held inside the viewport: the panel's right edge never leaves the page.
const GAP = 6
const EDGE = 12
const PANEL_WIDTH_GUESS = 300

function placeUnder(trigger: HTMLElement): Placement {
	const box = trigger.getBoundingClientRect()
	const room = window.innerWidth - EDGE - PANEL_WIDTH_GUESS
	return {
		top: box.bottom + GAP,
		left: Math.max(EDGE, Math.min(box.left, room)),
	}
}

type PopoverProps = {
	// The trigger's face (its icon and words) and whether its panel holds a choice in force.
	trigger: { face: ReactNode; isActive: boolean }
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
// outside or a resize close it, Escape handing focus back to the trigger; opened, it hands
// focus to its first control.
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
		if (isOpen)
			panelRef.current
				?.querySelector<HTMLElement>('button, input, a')
				?.focus()
	}, [isOpen])
	const toggle = (trigger: HTMLElement): void => {
		if (isOpen) dismiss('outside')
		else setPlace(placeUnder(trigger))
	}
	return { place, triggerRef, panelRef, toggle }
}

// A trigger and the panel it opens: Display and Filter, Linear's two controls over a view.
// The panel is fixed (an overlay escapes any scrolling column) under its trigger. It is a
// group of controls, not a menu: Tab moves through it.
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
