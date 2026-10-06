import { HOME_HREF } from '@entities/site/model/site-map'

export const SUBSCRIBE_PATH = '/api/subscribe'
export const EMAIL_FIELD = 'email'
// SMTP's longest address (RFC 5321 path, less its brackets).
export const EMAIL_MAX_LENGTH = 254
export const NAME_FIELD = 'name'
// Room for a full given name, not for a message.
export const NAME_MAX_LENGTH = 60
// One entry per ticked agent, so a form posted without scripts sends them the same way.
export const AGENT_FIELD = 'agent'
// A filled trap answers success and is stored nowhere.
export const TRAP_FIELD = 'website'

export const SUBSCRIBED_ID = 'subscribed'
export const SUBSCRIBED_HREF = `${HOME_HREF}#${SUBSCRIBED_ID}`
