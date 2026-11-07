import { SECTION_BY_ID } from '@entities/site/model/site-map'

// What a signup waits for: the product pages that ship today (a prototype stays off), in the site map's order. The start band's verdict and the welcome email list them.
export const COMING = SECTION_BY_ID.product.items.filter(
	page => page.availability === 'available',
)
