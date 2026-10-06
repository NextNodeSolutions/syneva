import { isInPageClick, navigate } from '@shared/lib/router'
import * as stylex from '@stylexjs/stylex'

import type { Style } from '@shared/lib/cx'
import type { ComponentPropsWithRef, MouseEvent, ReactElement } from 'react'

type AppLinkProps = Omit<
	ComponentPropsWithRef<'a'>,
	'className' | 'style' | 'href'
> & {
	href: string
	css?: Style | undefined
}

// A link to another page of the dashboard: a real anchor (it opens in a new tab, copies, and
// reads as a link), whose plain click moves inside the page instead of reloading it.
export function AppLink({
	href,
	css,
	onClick,
	...native
}: AppLinkProps): ReactElement {
	const follow = (event: MouseEvent<HTMLAnchorElement>): void => {
		onClick?.(event)
		if (!isInPageClick(event.nativeEvent, event.currentTarget)) return
		event.preventDefault()
		navigate(href)
	}
	return <a href={href} {...native} {...stylex.props(css)} onClick={follow} />
}
