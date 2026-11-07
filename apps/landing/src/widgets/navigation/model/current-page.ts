export const currentPage = (
	href: string,
	pathname: string,
): 'page' | undefined => (href === pathname ? 'page' : undefined)
