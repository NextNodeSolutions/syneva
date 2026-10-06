// The ids focus is moved to when the control that held it goes away (an armed close turning
// back into Close, a closed desk's row leaving): one name per target, shared by the elements
// that carry them and the code that focuses them.
export const NEW_REVIEW_ID = 'new-review'

// The Filter trigger, where focus goes once the last filter chip is gone.
export const FILTER_TRIGGER_ID = 'filter-trigger'

export const filterChipId = (key: string): string => `filter-chip-${key}`

// The page column, which takes focus when the target cannot (HubShell's main).
const PAGE_ID = 'hub-main'

// Focus the element `id` names; one out of reach (New review inside the phone's closed
// drawer, which is inert and off screen) hands focus to the page instead of dropping it.
export function focusTarget(id: string): void {
	const target = document.getElementById(id)
	if (target?.closest('[inert]') === null && target.checkVisibility()) {
		target.focus()
		return
	}
	document.getElementById(PAGE_ID)?.focus({ preventScroll: true })
}

export const deskLinkId = (deskId: string): string => `desk-link-${deskId}`
export const deskCloseId = (deskId: string): string => `desk-close-${deskId}`
export const deskKeepId = (deskId: string): string => `desk-keep-${deskId}`
