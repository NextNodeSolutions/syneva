import path from 'node:path'

import { platformOpenCommand } from '../../platform-open.js'

import type { EditorScope } from '@syneva/core/application/ports'

// Terminal editors (vim/nvim/vi) deliberately absent: the desk spawns the command from a server process with no TTY, so they could never attach - they'd hang until the exec timeout killed them.
// Editors open the file they are given as text.
const EDITORS = new Set(['code', 'cursor', 'windsurf', 'zed', 'subl'])
// The OS's own openers hand the file to its type's application, which runs it when it is a
// program: the machine's own requests only (EditorScope).
const OS_OPENERS = new Set(['open', 'xdg-open'])

const SHELL_META = /[|&;<>`]/
// The values a request supplies; the program itself is spelled by the template alone.
const PLACEHOLDER = /\{(?:repo|file|line)\}/

export type EditorCommand = {
	command: string
	args: string[]
}

// Why a template does not launch, as the route's failure codes say it (ports.ts, EditorLaunch).
export type EditorRefusalCode =
	| 'EDITOR_NOT_ALLOWED'
	| 'BAD_EDITOR_COMMAND'
	| 'EDITOR_LOCAL_ONLY'

export class EditorRefusal extends Error {
	readonly code: EditorRefusalCode

	constructor(code: EditorRefusalCode, message: string) {
		super(message)
		this.name = 'EditorRefusal'
		this.code = code
	}
}

function editorName(command: string): string {
	const posix = path.basename(command)
	const win = path.win32.basename(command)
	return win.length < posix.length ? win : posix
}

function parseCommandTemplate(input: string): string[] {
	const tokens: string[] = []
	let current = ''
	let quote: "'" | '"' | null = null
	for (const ch of input) {
		const isQuote = ch === "'" || ch === '"'
		if (isQuote && (quote === null || quote === ch)) {
			quote = quote === null ? ch : null
			continue
		}
		if (quote !== null || !/\s/.test(ch)) {
			current += ch
			continue
		}
		if (current) {
			tokens.push(current)
			current = ''
		}
	}
	if (quote)
		throw new EditorRefusal(
			'BAD_EDITOR_COMMAND',
			'Unclosed quote in editor command.',
		)
	if (current) tokens.push(current)
	return tokens
}

function expandToken(
	token: string,
	values: { repo: string; file: string; line: number },
): string {
	return token
		.replaceAll('{repo}', values.repo)
		.replaceAll('{file}', values.file)
		.replaceAll('{line}', String(values.line))
}

export function normalizeLine(line: unknown): number {
	const n = typeof line === 'number' ? line : Number(line)
	return Number.isInteger(n) && n > 0 ? n : 1
}

// The command a template names for one file. Its program is the template's first token as
// written, never one a placeholder fills in: {repo}, {file} and {line} come from the desk and the
// request, so a placeholder there would let a request name the program. An empty template is the
// OS opener.
export function resolveEditorCommand(
	template: string,
	values: { repo: string; file: string; line?: unknown },
	scope: EditorScope,
): EditorCommand {
	const line = normalizeLine(values.line)
	const trimmed = template.trim()
	if (!trimmed) {
		if (!scope.osOpener) throw localOnly()
		return platformOpenCommand(values.file)
	}
	if (trimmed.includes('$(') || SHELL_META.test(trimmed))
		throw new EditorRefusal(
			'BAD_EDITOR_COMMAND',
			'Editor command contains shell syntax.',
		)
	const [command, ...argumentTemplates] = parseCommandTemplate(trimmed)
	if (!command)
		throw new EditorRefusal(
			'BAD_EDITOR_COMMAND',
			'Editor command is empty.',
		)
	if (PLACEHOLDER.test(command))
		throw new EditorRefusal(
			'BAD_EDITOR_COMMAND',
			'Editor command names its program through a placeholder; {repo}, {file} and {line} go in its arguments.',
		)
	const basename = editorName(command)
	if (OS_OPENERS.has(basename) && !scope.osOpener) throw localOnly()
	if (!EDITORS.has(basename) && !OS_OPENERS.has(basename))
		throw new EditorRefusal(
			'EDITOR_NOT_ALLOWED',
			`Editor "${basename}" is not allowed.`,
		)
	return {
		command,
		args: argumentTemplates.map(token =>
			expandToken(token, { ...values, line }),
		),
	}
}

function localOnly(): EditorRefusal {
	return new EditorRefusal(
		'EDITOR_LOCAL_ONLY',
		`From the web, the hub opens a file only in an editor its own settings name (${[...EDITORS].join(', ')}): the OS opener runs whatever the file's type names.`,
	)
}
