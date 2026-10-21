// A TS/JS file's outline through oxc's parser: the top-level declarations a changed block can belong to (class members qualified by their class), the imports, and what each line holds. A file oxc cannot parse at all has no outline; a partly broken one keeps what parsed.
import { parseSync } from 'oxc-parser'

import { statementDeclared } from './script-declarations.js'
import { identifiersIn, lineIndex, lineKinds } from './script-lines.js'

import type {
	OutlineDeclaration,
	OutlineImport,
	SourceOutline,
} from '@syneva/core/domain/outline'
import type { Directive, EcmaScriptModule, Statement } from 'oxc-parser'
import type { Declared } from './script-declarations.js'
import type { LineIndex } from './script-lines.js'

// Module wiring: imports, re-exports and bare export lists - the lines a block can change without touching code.
function isWiring(statement: Directive | Statement): boolean {
	if (statement.type === 'ImportDeclaration') return true
	if (statement.type === 'ExportAllDeclaration') return true
	return statement.type === 'ExportNamedDeclaration' && !statement.declaration
}

type ImportEntry = EcmaScriptModule['staticImports'][number]['entries'][number]

// The parser types the kind as an ambient const enum, which a module cannot reference at runtime: compared as the string it is.
function importedName(entry: ImportEntry): string {
	const kind: string = entry.importName.kind
	if (kind === 'Default') return 'default'
	if (kind === 'Name') return entry.importName.name ?? entry.localName.value
	return '*'
}

function importsOf(module: EcmaScriptModule): OutlineImport[] {
	return module.staticImports.flatMap(statement =>
		statement.entries.map(entry => ({
			local: entry.localName.value,
			imported: importedName(entry),
			source: statement.moduleRequest.value,
		})),
	)
}

// A declaration owns the comment lines right above it (its doc comment): a block that only rewrites that comment is named by the declaration.
function withLeadingComments(kinds: string, startLine: number): number {
	// 0-based: the declaration's first line, walking up while the line above is a comment.
	let index = startLine - 1
	while (index > 0 && kinds[index - 1] === 'c') index--
	return index + 1
}

function numbered(
	index: LineIndex,
	kinds: string,
	declared: Declared,
): OutlineDeclaration {
	return {
		name: declared.name,
		kind: declared.kind,
		startLine: withLeadingComments(
			kinds,
			index.lineOf(declared.span.start),
		),
		endLine: index.lineOf(
			Math.max(declared.span.start, declared.span.end - 1),
		),
		isExported: declared.isExported,
		uses: identifiersIn(declared.node),
	}
}

export function scriptOutline(
	path: string,
	text: string,
): SourceOutline | null {
	const parsed = parseSync(path, text)
	const { body } = parsed.program
	if (!body.length && parsed.errors.length) return null
	const index = lineIndex(text)
	const kinds = lineKinds(index, body.filter(isWiring), parsed.comments)
	return {
		declarations: body
			.flatMap(statementDeclared)
			.map(declared => numbered(index, kinds, declared)),
		imports: importsOf(parsed.module),
		lineKinds: kinds,
	}
}
