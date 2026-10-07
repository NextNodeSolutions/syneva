import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { welcomeText } from './welcome-text'
import { WelcomeEmail } from './WelcomeEmail'

import type { ListEmailProps } from '../model/list-email'

type RenderedEmail = { html: string; text: string }

// The doctype React Email's own render() prepends: the one mail clients render most alike.
const XHTML_DOCTYPE =
	'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

// React Email's components, rendered by React itself: React Email's render() also imports Prettier and html-to-text for options this never uses, and the Worker would carry them for nothing. The plain text is laid out by hand (welcome-text.ts).
export function renderWelcome(props: ListEmailProps): RenderedEmail {
	const markup = renderToStaticMarkup(createElement(WelcomeEmail, props))
	return {
		html: `${XHTML_DOCTYPE}${markup.replace(/<!DOCTYPE[^>]*>/i, '')}`,
		text: welcomeText(props),
	}
}
