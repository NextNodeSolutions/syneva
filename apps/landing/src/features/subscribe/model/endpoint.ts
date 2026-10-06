import { HOME_HREF } from '@entities/site/model/site-map'

export const SUBSCRIBE_PATH = '/api/subscribe'
export const EMAIL_FIELD = 'email'
// SMTP's longest address (RFC 5321 path, less its brackets).
export const EMAIL_MAX_LENGTH = 254
// A filled trap answers success and is stored nowhere.
export const TRAP_FIELD = 'website'

export const SUBSCRIBED_ID = 'subscribed'
export const SUBSCRIBED_HREF = `${HOME_HREF}#${SUBSCRIBED_ID}`
