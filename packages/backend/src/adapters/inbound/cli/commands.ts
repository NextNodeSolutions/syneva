import { API_PATHS, hubDeskPath } from '@syneva/contracts/routes'

import { appendDomainComment } from '../../../application/add-domain-comment.js'
import { appendComment } from '../../../application/comments.js'
import { parseLineNumber } from '../../../domain/comments.js'
import { sanitizeSession } from '../../../domain/identity.js'
import { printJson, warn } from '../../outbound/console.js'
import { nodeReviewStore } from '../../outbound/filesystem/persistence.js'
import { getBranch, nodeGit } from '../../outbound/git/repo.js'

import { flagText, resolveRoot } from './args.js'
import {
	connectHub,
	deskEndpoint,
	findDesk,
	hubEndpoint,
	hubSend,
	httpGetJson,
	listDesks,
	NO_CONTENT,
} from './hub-client.js'
import { noDeskHint, targetDesk } from './target-desk.js'

import type { DeskSummary } from '@syneva/contracts/hub'
import type { DomainCommentInput } from '../../../domain/domain-comments.js'
import type { CliArgs } from './args.js'
import type { HubConnection } from './hub-client.js'

type LinePayload = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	body: string
	role: 'agent'
}

type CommentPayload = LinePayload | DomainCommentInput

const HTTP_OK = 200
const COMMENT_USAGE =
	'Usage: syneva comment --path <file> --line <n> [--side additions|deletions] --body "..."\n' +
	'       (--line 0 replies into the file header thread; omit --side there) [--session <id>] [--repo <path>]\n' +
	'       syneva comment --domain <id> [--block <id>] --body "..."   (a reply in a guide thread: a domain, or one of its blocks)'
const STATUS_USAGE =
	'Usage: syneva status --body "..." [--session <id>] [--repo <path>]'

// Post an agent reply; over HTTP when a live desk hosts the session so the open tab updates
// immediately, else appended to the saved review for the desk's next open.
export async function runComment(args: CliArgs): Promise<void> {
	const payload = parseCommentPayload(args)
	if (!payload) {
		warn(COMMENT_USAGE)
		process.exitCode = 1
		return
	}
	const live = await targetDesk(args)
	if (live) {
		const response = await hubSend(
			live.hub,
			'POST',
			deskEndpoint(live.hub.url, live.desk.id, API_PATHS.comment),
			payload,
		)
		if (response.status === HTTP_OK) {
			printJson({
				ok: true,
				live: true,
				session: live.desk.session,
				commentId: readCommentId(response.body),
			})
			return
		}
	}
	const root = await resolveRoot(args)
	// sanitizeSession turns an empty branch (detached HEAD) into the default session name.
	const session = sanitizeSession(
		flagText(args, 'session') ?? (await getBranch(root)),
	)
	const comment =
		'domainId' in payload
			? await appendDomainComment(root, session, payload, nodeReviewStore)
			: await appendComment(root, session, payload, {
					store: nodeReviewStore,
					git: nodeGit,
				})
	printJson({ ok: true, live: false, session, commentId: comment.id })
}

// --domain names a guide thread instead of a line; the hub resolves the target against the attached guide.
function parseCommentPayload(args: CliArgs): CommentPayload | null {
	const body = flagText(args, 'body')?.trim() ?? ''
	const domainId = flagText(args, 'domain')
	if (domainId && body)
		return {
			domainId,
			blockId: flagText(args, 'block'),
			body,
			role: 'agent',
		}
	const path = flagText(args, 'path') ?? ''
	if (!path || !body) return null
	const side: 'additions' | 'deletions' =
		args.side === 'deletions' ? 'deletions' : 'additions'
	const lineNumber = parseLineNumber(args.line)
	if (lineNumber === null) return null
	return { path, side, lineNumber, body, role: 'agent' }
}

function readCommentId(body: unknown): string | undefined {
	if (typeof body !== 'object' || body === null) return undefined
	if (!('commentId' in body) || typeof body.commentId !== 'string')
		return undefined
	return body.commentId
}

// No offline fallback: ephemeral status is meaningless without a live desk, and it must never fail
// the agent loop - no desk just reports { live: false }, exit 0.
export async function runStatus(args: CliArgs): Promise<void> {
	const body = flagText(args, 'body')?.trim() ?? ''
	if (!body) {
		warn(STATUS_USAGE)
		process.exitCode = 1
		return
	}
	const live = await targetDesk(args)
	if (live) {
		const response = await hubSend(
			live.hub,
			'POST',
			deskEndpoint(live.hub.url, live.desk.id, API_PATHS.status),
			{ body },
		)
		if (response.status === HTTP_OK) {
			printJson({ ok: true, live: true, session: live.desk.session })
			return
		}
	}
	printJson({ ok: false, live: false, session: flagText(args, 'session') })
}

// Block until the next desk event, print it as a tagged envelope, exit: question (answer now),
// review (reviewer hit Send), closed. Call in a loop and branch on `kind`; answer via `syneva comment`.
export async function runAwait(args: CliArgs): Promise<void> {
	const live = await targetDesk(args)
	if (!live) {
		warn(noDeskHint(args))
		process.exitCode = 1
		return
	}
	const response = await httpGetJson(awaitUrl(live, args), live.hub.key)
	if (response.status === NO_CONTENT) return // --timeout fired, no event: the loop re-polls
	const event: unknown = response.body
	if (
		response.status === HTTP_OK &&
		typeof event === 'object' &&
		event !== null &&
		'kind' in event
	) {
		printJson(event)
		return
	}
	// A dead/unreachable desk must NOT return empty-and-0, or the spec's `while ev=$(syneva await)`
	// loop would spin against a corpse; exit non-zero so the caller re-checks liveness.
	warn(
		`Desk for session "${live.desk.session}" is not answering (closed, or the hub stopped? ${live.hub.url}).`,
	)
	process.exitCode = 1
}

function awaitUrl(
	live: { hub: HubConnection; desk: DeskSummary },
	args: CliArgs,
): string {
	const base = deskEndpoint(live.hub.url, live.desk.id, API_PATHS.awaitSend)
	const timeout = Number(flagText(args, 'timeout') ?? 0)
	return timeout > 0 ? `${base}?timeout=${timeout}` : base
}

// Idempotent: exit 0 whether or not anything was open, so agents call it unconditionally when a
// round settles; the hub tells a parked waiter (a `closed` event) and keeps the review saved.
export async function runClose(args: CliArgs): Promise<void> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) {
		printJson({ ok: true, stopped: [], closed: [] })
		return
	}
	const root = await resolveRoot(args)
	const desks =
		args.all === true
			? await listDesks(hub, root)
			: [await findDesk(hub, root, flagText(args, 'session'))].flatMap(
					desk => (desk ? [desk] : []),
				)
	const closed: string[] = []
	await Promise.all(
		desks.map(async desk => {
			const response = await hubSend(
				hub,
				'DELETE',
				hubEndpoint(hub.url, hubDeskPath(desk.id)),
			)
			if (response.status === HTTP_OK) closed.push(desk.session)
		}),
	)
	// stopped is the name the previous contract printed; both ride for a transition.
	printJson({ ok: true, stopped: closed, closed })
}
