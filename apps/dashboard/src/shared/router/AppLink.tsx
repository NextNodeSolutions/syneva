import { navigate } from './location'

import type { ComponentPropsWithRef, MouseEvent, ReactElement } from 'react'

type AppLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { to: string }

const PRIMARY_BUTTON = 0

export function AppLink({ to, onClick, ...props }: AppLinkProps): ReactElement {
	const followInApp = (event: MouseEvent<HTMLAnchorElement>): void => {
		onClick?.(event)
		if (event.defaultPrevented || !isPlainClick(event)) return
		event.preventDefault()
		navigate(to)
	}
	return <a {...props} href={to} onClick={followInApp} />
}

// A modified click or a link with a target keeps the browser's own behavior (new tab, download...).
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
	return (
		event.button === PRIMARY_BUTTON &&
		!event.metaKey &&
		!event.ctrlKey &&
		!event.shiftKey &&
		!event.altKey &&
		!event.currentTarget.target
	)
}
