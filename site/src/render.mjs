// Prints one rendered route to stdout. The dev server runs this in a fresh
// process per request, so edits to any page module show on the next reload
// without restarting the server. Exit code 2 = no page for that route.
import { loadPages, renderPage } from './site.mjs'

const route = process.argv[2] ?? '/'
const pages = await loadPages()
const page = pages.find(candidate => candidate.route === route)
if (!page) process.exit(2)
process.stdout.write(renderPage(page))
