// What every email the list sends is drawn from: the address it goes to, and the site its links and images point back at (the deploy's SITE_URL, or the dev server's own origin in the preview).
export type ListEmailProps = { recipient: string; origin: string }
