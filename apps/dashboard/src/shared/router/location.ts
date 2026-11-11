const LOCATION_CHANGE = 'popstate'

export function subscribeToLocation(onChange: () => void): () => void {
	window.addEventListener(LOCATION_CHANGE, onChange)
	return () => window.removeEventListener(LOCATION_CHANGE, onChange)
}

export function readPathname(): string {
	return window.location.pathname
}

export function navigate(path: string): void {
	window.history.pushState(null, '', path)
	window.dispatchEvent(new PopStateEvent(LOCATION_CHANGE))
}
