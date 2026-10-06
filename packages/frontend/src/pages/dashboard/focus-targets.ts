// The ids focus is moved to when the control that held it goes away (an armed close turning
// back into Close, a closed desk's row leaving): one name per target, shared by the elements
// that carry them and the code that focuses them.
export const NEW_REVIEW_ID = 'new-review'

export const deskLinkId = (deskId: string): string => `desk-link-${deskId}`
export const deskCloseId = (deskId: string): string => `desk-close-${deskId}`
export const deskKeepId = (deskId: string): string => `desk-keep-${deskId}`
