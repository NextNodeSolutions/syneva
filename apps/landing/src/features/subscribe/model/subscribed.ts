import { HOME_HREF } from '@entities/site/model/site-map'

// Where a signup posted without scripts lands: the home's confirmation, shown while it is the page's target. Apart from endpoint.ts, which the islands import, so they do not ship the site map.
export const SUBSCRIBED_ID = 'subscribed'
export const SUBSCRIBED_HREF = `${HOME_HREF}#${SUBSCRIBED_ID}`
