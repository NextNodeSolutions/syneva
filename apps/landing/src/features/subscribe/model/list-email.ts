// The emails the list sends: a welcome to a new address, and a note to an address already on the list that signs up again.
export const LIST_EMAILS = ['welcome', 'already-listed'] as const
export type ListEmail = (typeof LIST_EMAILS)[number]

export const isListEmail = (kind: string): kind is ListEmail =>
	LIST_EMAILS.some(listEmail => listEmail === kind)

// What every email the list sends is drawn from: the address it goes to, and the site its links and images point back at (the deploy's SITE_URL, or the dev server's own origin in the preview).
export type ListEmailProps = { recipient: string; origin: string }
