// aria-current for a menu link: "page" on the link to the page being rendered.
export const currentPage = (
	href: string,
	pathname: string,
): 'page' | undefined => (href === pathname ? 'page' : undefined)
