import { HOME_HREF } from '@entities/site/model/site-map'

// The signup's endpoint (src/pages/api/subscribe.ts: file-based routing puts
// it at this address) and the fields its form posts.
export const SUBSCRIBE_PATH = '/api/subscribe'
export const EMAIL_FIELD = 'email'
// The longest address SMTP carries (RFC 5321's path, less its brackets).
export const EMAIL_MAX_LENGTH = 254
// A field people never see and bots fill in: a filled trap is answered as a
// success and stored nowhere.
export const TRAP_FIELD = 'website'

// Where a form posted without scripts lands after a signup: the home's start
// band, whose confirmation shows while it is the page's target.
export const SUBSCRIBED_ID = 'subscribed'
export const SUBSCRIBED_HREF = `${HOME_HREF}#${SUBSCRIBED_ID}`
