declare namespace App {
	// "home" renders the landing's own sections, "sub" every page with a page hero, "lost" the 404.
	type PageKind = 'home' | 'sub' | 'lost'
	interface Locals {
		// Set by src/middleware.ts for every route.
		page: PageKind
	}
}
