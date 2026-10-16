#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { SPEC } from '@syneva/contracts/spec'

import { leadingPositionals, parseArgs } from '../adapters/inbound/cli/args.js'
import {
	runAwait,
	runClose,
	runComment,
	runReload,
	runStatus,
} from '../adapters/inbound/cli/commands.js'
import { runDesks } from '../adapters/inbound/cli/desks.js'
import { runInventory } from '../adapters/inbound/cli/inventory.js'
import { runOpen } from '../adapters/inbound/cli/open.js'
import {
	runHubStatus,
	runHubStop,
	runStart,
} from '../adapters/inbound/cli/start.js'
import { printLine, warn } from '../adapters/outbound/console.js'
import { currentVersion } from '../adapters/outbound/package-registry/update.js'

import type { CliArgs } from '../adapters/inbound/cli/args.js'

const HELP = `syneva - an integrated review environment (IRE) for code you didn't write by hand.

The hub is one long-running process per machine: it hosts every review desk and serves the
dashboard. Agents never run a server - they open desks on the hub and attach to them.

Hub:
  syneva start [--detach]           Run the hub (dashboard at http://127.0.0.1:4747/); --detach backgrounds it
  syneva hub                        Print the running hub's health as JSON
  syneva hub stop                   Stop the hub (desks stay saved; the next start restores them)

Desks:
  syneva open [--diff working|staged] [--path <p>]   Open (or reload) a desk over the working-tree/staged diff
  syneva open file <path>           Open a desk over a single file or artifact (tracked or not)
  syneva open pr <ref|number|url>   Open a desk over a branch's commits vs its merge-base
  syneva inventory [file <path> | pr <ref>] [--diff staged] [--path <p>]
                                    Print the review source a guide is authored against (fingerprint, files, changed units)
  syneva desks [--all]              List this repo's live desks (--all: the whole hub) with their URLs
  syneva close [--session <id>|--all]  Close this repo's desk(s); idempotent (alias: stop)
  (syneva / syneva file / syneva pr are shorthands for syneva open … and start a hub when none runs)

Agent loop:
  syneva await [--timeout <s>]      Block for the next desk event (question | review | closed)
  syneva comment --path <f> --line <n> --body "..."   Post an agent reply into the desk
  syneva status --body "..."        Post an ephemeral "what I'm doing" line into the desk
  syneva reload [--guide <file>]    Re-diff the working tree into the open desk
                                    (--guide swaps the attached review guide too)
  syneva spec                       Print the full agent contract (modes, loop, ReviewResult, guide schema)

Common flags:
  --repo <path>     Repo to review / target (default: cwd)
  --session <id>    Review session id (default: branch / file-<path> / pr-<ref>)
  --guide <file>    Attach the review guide (JSON; syneva spec prints the schema) when opening or reloading
  --no-open         Don't open the browser
  --hub <url>       The hub to talk to (default: this machine's hub)
  --key <secret>    Access key of a key-protected hub (SYNEVA_KEY)
  -h, --help        Show this help
  -v, --version     Show version

Hub flags (syneva start):
  --port <n>        Hub port (default 4747; agents on another port need SYNEVA_PORT)
  --host <addr>     Bind address (default 127.0.0.1). Beyond loopback requires --key
  --key <secret>    Require this access key on every request (hosted mode)
  --public-url <u>  The origin reviewers use behind a reverse proxy (printed + trusted)
  --insecure        Allow a non-loopback bind without a key (trusted networks only)

Env:
  SYNEVA_HUB / SYNEVA_KEY / SYNEVA_PORT / SYNEVA_HOST / SYNEVA_PUBLIC_URL   Defaults for the flags above
  SYNEVA_ALLOWED_HOSTS=a,b   Extra Host authorities to accept when bound beyond loopback
  SYNEVA_NO_AUTOSTART=1      Never start a hub from a desk command
  SYNEVA_NO_UPDATE_CHECK=1   Skip the new-version check at hub start

Docs: https://github.com/walid-mos/syneva`

// process.argv is [node, script, ...userArgs] - the CLI only ever sees the trailing args.
const USER_ARG_START_INDEX = 2

async function main(): Promise<void> {
	const argv = process.argv.slice(USER_ARG_START_INDEX)
	if (argv.includes('-v') || argv.includes('--version')) {
		printLine(currentVersion())
		return
	}
	if (argv[0] === 'help' || argv.includes('-h') || argv.includes('--help')) {
		printLine(HELP)
		return
	}
	const sub = argv[0] && !argv[0].startsWith('--') ? argv[0] : null
	const rest = sub ? argv.slice(1) : argv
	await dispatch(sub, leadingPositionals(rest), parseArgs(rest))
}

async function dispatch(
	sub: string | null,
	positionals: string[],
	args: CliArgs,
): Promise<void> {
	const [first, second] = positionals
	switch (sub) {
		case 'start':
			return runStart(args)
		case 'hub':
			return first === 'stop' ? runHubStop(args) : runHubStatus(args)
		case 'open':
			return dispatchOpen(first, second, args)
		case 'inventory':
			return dispatchInventory(first, second, args)
		case 'file':
			return runOpen('file', first, args)
		case 'pr':
			return runOpen('pr', first, args)
		case null:
			return runOpen('repo', undefined, args)
		case 'spec':
			printLine(SPEC)
			return
		default:
			return dispatchAgentCommand(sub, args)
	}
}

async function dispatchAgentCommand(sub: string, args: CliArgs): Promise<void> {
	switch (sub) {
		case 'desks':
			return runDesks(args)
		case 'comment':
			return runComment(args)
		case 'status':
			return runStatus(args)
		case 'await':
			return runAwait(args)
		case 'reload':
			return runReload(args)
		case 'close':
		case 'stop':
			return runClose(args)
		default:
			return unknownCommand(sub)
	}
}

function dispatchOpen(
	first: string | undefined,
	second: string | undefined,
	args: CliArgs,
): Promise<void> {
	if (first === 'file') return runOpen('file', second, args)
	if (first === 'pr') return runOpen('pr', second, args)
	if (first) {
		warn(
			`Unknown open target "${first}". Use: syneva open | syneva open file <path> | syneva open pr <ref>.`,
		)
		process.exitCode = 1
		return Promise.resolve()
	}
	return runOpen('repo', undefined, args)
}

function dispatchInventory(
	first: string | undefined,
	second: string | undefined,
	args: CliArgs,
): Promise<void> {
	if (first === 'file') return runInventory('file', second, args)
	if (first === 'pr') return runInventory('pr', second, args)
	if (first) {
		warn(
			`Unknown inventory target "${first}". Use: syneva inventory | syneva inventory file <path> | syneva inventory pr <ref>.`,
		)
		process.exitCode = 1
		return Promise.resolve()
	}
	return runInventory('repo', undefined, args)
}

function unknownCommand(sub: string): void {
	warn(
		`Unknown command "${sub}". Use: start | hub [stop] | open [file <path> | pr <ref>] | inventory [file <path> | pr <ref>] | desks | await | comment | status | reload | close | spec.`,
	)
	process.exitCode = 1
}

// An uncaught failure is reported as text: the stack names the failing frame; a thrown value that isn't an Error (or carries no stack) falls back to its message or String().
function errorText(error: unknown): string {
	if (!(error instanceof Error)) return String(error)
	if (error.stack) return error.stack
	return error.message
}

async function runMain(): Promise<void> {
	try {
		await main()
	} catch (error) {
		warn(errorText(error))
		process.exitCode = 1
	}
}

// Run only when executed as the bin, not when imported (an import alone would open a desk).
// npm installs the bin as a symlink: import.meta.url resolves through it but argv[1] stays the symlink path, so it must be realpath'd before comparing,
// else the guard never fires and the CLI silently no-ops (try/catch covers a dangling/unusual argv[1]).
function isEntryPoint(): boolean {
	try {
		return (
			!!process.argv[1] &&
			import.meta.url ===
				pathToFileURL(realpathSync(process.argv[1])).href
		)
	} catch {
		return false
	}
}

if (isEntryPoint()) await runMain()
