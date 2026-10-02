import { lostDiff } from '../art/resources.mjs'
import { primary, textLink } from '../ui.mjs'

export default {
	route: '/404',
	title: 'Page not found · Syneva',
	description: 'This page does not exist. Every page that does is linked from the navigation and the footer.',
	body: () => `<section class="lost" aria-labelledby="page-title" data-reveal>
      <div><h1 id="page-title" data-reveal-item>This change<br>was undone.</h1><p data-reveal-item>The page you asked for doesn’t exist, or moved. Everything that does is one click away.</p><div class="page-actions" data-reveal-item>${primary('/', 'Back to the home page')}${textLink('/get-started/', 'Get started')}</div></div>
      <figure class="lost-art motion-scene" data-reveal-item>${lostDiff()}</figure>
    </section>`,
}
