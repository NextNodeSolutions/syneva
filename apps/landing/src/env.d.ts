declare namespace App {
	// "home" renders with the landing's own sections, "sub" is every page with
	// a page hero, "lost" the 404.
	type PageKind = 'home' | 'sub' | 'lost'
	interface Locals {
		// Set by src/middleware.ts for every route.
		page: PageKind
	}
}
