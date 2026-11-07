import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { alreadyListedText } from './already-listed-text'
import { AlreadyListedEmail } from './AlreadyListedEmail'
import { welcomeText } from './welcome-text'
import { WelcomeEmail } from './WelcomeEmail'

import type { ReactElement } from 'react'
import type { ListEmail, ListEmailProps } from '../model/list-email'

type RenderedEmail = { html: string; text: string }

// Each email as React Email's components draw it, and its plain-text body, laid out by hand from the same copy.
type EmailParts = {
	Template: (props: ListEmailProps) => ReactElement
	text: (props: ListEmailProps) => string
}

const PARTS: Record<ListEmail, EmailParts> = {
	welcome: { Template: WelcomeEmail, text: welcomeText },
	'already-listed': { Template: AlreadyListedEmail, text: alreadyListedText },
}

// The doctype React Email's own render() prepends: the one mail clients render most alike.
const XHTML_DOCTYPE =
	'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

// React Email's components, rendered by React itself: React Email's render() also imports Prettier and html-to-text for options this never uses, and the Worker would carry them for nothing.
export function renderEmail(
	kind: ListEmail,
	props: ListEmailProps,
): RenderedEmail {
	const { Template, text } = PARTS[kind]
	const markup = renderToStaticMarkup(createElement(Template, props))
	return {
		html: `${XHTML_DOCTYPE}${markup.replace(/<!DOCTYPE[^>]*>/i, '')}`,
		text: text(props),
	}
}
