import type {
	Class,
	Declaration,
	Directive,
	ExportDefaultDeclarationKind,
	ExpressionStatement,
	Statement,
	VariableDeclaration,
} from 'oxc-parser'
// The declarations a top-level statement introduces, as oxc parses them: functions, classes with their members (qualified by the class), variables (a function or class value keeps its kind), TS types, and top-level calls named by their callee and first string argument.
import type { SymbolKind } from '../../../domain/outline.js'

type Span = { start: number; end: number }

// A declaration before its lines are numbered: the node its identifiers are read from, and the span it covers (the `export` keyword included).
export type Declared = {
	name: string
	kind: SymbolKind
	node: unknown
	span: Span
	isExported: boolean
}

type Placement = { span: Span; isExported: boolean }

const CALL_ARGUMENT_CHARS = 60

function named(
	name: string | undefined,
	kind: SymbolKind,
	node: Span,
	placement: Placement,
): Declared[] {
	return name ? [{ name, kind, node, ...placement }] : []
}

function classMembers(owner: string, body: Class['body']): Declared[] {
	return body.body.flatMap(member => {
		if (!('key' in member) || member.key.type !== 'Identifier') return []
		const isCallable =
			member.type !== 'PropertyDefinition' ||
			member.value?.type === 'ArrowFunctionExpression' ||
			member.value?.type === 'FunctionExpression'
		const kind: SymbolKind = isCallable ? 'method' : 'variable'
		return named(`${owner}.${member.key.name}`, kind, member, {
			span: member,
			isExported: false,
		})
	})
}

function classDeclared(node: Class, placement: Placement): Declared[] {
	const name = node.id?.name ?? 'default'
	return [
		...named(name, 'class', node, placement),
		...classMembers(name, node.body),
	]
}

function variablesDeclared(
	node: VariableDeclaration,
	placement: Placement,
): Declared[] {
	const isSingle = node.declarations.length === 1
	return node.declarations.flatMap(declarator => {
		if (declarator.id.type !== 'Identifier') return []
		const init = declarator.init?.type
		let kind: SymbolKind = 'variable'
		if (init === 'ArrowFunctionExpression' || init === 'FunctionExpression')
			kind = 'function'
		if (init === 'ClassExpression') kind = 'class'
		const span = isSingle ? placement.span : declarator
		return named(declarator.id.name, kind, declarator, {
			span,
			isExported: placement.isExported,
		})
	})
}

// `describe("guide", …)`, `app.get("/x", …)`: a top-level call is named by its callee and its first string argument.
function callDeclared(node: ExpressionStatement): Declared[] {
	const call = node.expression
	if (call.type !== 'CallExpression') return []
	const { callee } = call
	let name: string | undefined
	if (callee.type === 'Identifier') name = callee.name
	if (
		callee.type === 'MemberExpression' &&
		callee.object.type === 'Identifier' &&
		callee.property.type === 'Identifier'
	)
		name = `${callee.object.name}.${callee.property.name}`
	if (!name) return []
	const [first] = call.arguments
	const label =
		first?.type === 'Literal' && typeof first.value === 'string'
			? `${name}(${JSON.stringify(first.value.slice(0, CALL_ARGUMENT_CHARS))})`
			: `${name}()`
	return named(label, 'call', node, { span: node, isExported: false })
}

function defaultDeclared(
	node: ExportDefaultDeclarationKind,
	span: Span,
): Declared[] {
	const placement = { span, isExported: true }
	if (node.type === 'FunctionDeclaration')
		return named(node.id?.name ?? 'default', 'function', node, placement)
	if (node.type === 'ClassDeclaration') return classDeclared(node, placement)
	return named('default', 'variable', node, placement)
}

// `namespace A.B {}` or `declare module "x" {}`: named by the identifier or the module string.
function moduleName(
	node: Extract<Declaration, { type: 'TSModuleDeclaration' }>,
): string {
	if (node.id.type === 'Literal') return node.id.value
	if (node.id.type === 'Identifier') return node.id.name
	return 'namespace'
}

function declarationDeclared(
	node: Declaration,
	placement: Placement,
): Declared[] {
	switch (node.type) {
		case 'FunctionDeclaration':
		case 'FunctionExpression':
		case 'TSDeclareFunction':
		case 'TSEmptyBodyFunctionExpression':
			return named(node.id?.name, 'function', node, placement)
		case 'ClassDeclaration':
		case 'ClassExpression':
			return classDeclared(node, placement)
		case 'VariableDeclaration':
			return variablesDeclared(node, placement)
		case 'TSInterfaceDeclaration':
			return named(node.id.name, 'interface', node, placement)
		case 'TSTypeAliasDeclaration':
			return named(node.id.name, 'type', node, placement)
		case 'TSEnumDeclaration':
			return named(node.id.name, 'enum', node, placement)
		case 'TSModuleDeclaration':
			return named(moduleName(node), 'type', node, placement)
		// `import x = require("y")` is module wiring, not a declaration a block belongs to.
		case 'TSImportEqualsDeclaration':
			break
	}
	return []
}

const DECLARATION_TYPES: ReadonlySet<string> = new Set([
	'FunctionDeclaration',
	'TSDeclareFunction',
	'ClassDeclaration',
	'VariableDeclaration',
	'TSInterfaceDeclaration',
	'TSTypeAliasDeclaration',
	'TSEnumDeclaration',
	'TSModuleDeclaration',
])

function isDeclaration(
	statement: Directive | Statement,
): statement is Declaration {
	return DECLARATION_TYPES.has(statement.type)
}

export function statementDeclared(
	statement: Directive | Statement,
): Declared[] {
	if (statement.type === 'ExportNamedDeclaration')
		return statement.declaration
			? declarationDeclared(statement.declaration, {
					span: statement,
					isExported: true,
				})
			: []
	if (statement.type === 'ExportDefaultDeclaration')
		return defaultDeclared(statement.declaration, statement)
	if (statement.type === 'ExpressionStatement') return callDeclared(statement)
	if (isDeclaration(statement))
		return declarationDeclared(statement, {
			span: statement,
			isExported: false,
		})
	return []
}
