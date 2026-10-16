import { API_PATHS } from '@syneva/contracts/routes'

import {
	askQuestion,
	awaitEvent,
	postStatus,
	stopDesk,
} from './routes/agent.js'
import { serveBlob } from './routes/blob.js'
import {
	serveInventory,
	servePoll,
	serveSettings,
	serveState,
	serveTree,
	saveSettings,
} from './routes/desk.js'
import { openInEditor } from './routes/editor.js'
import { serveFile, serveFileContents } from './routes/files.js'
import { reloadDeskFromRequest } from './routes/reload.js'
import {
	addComment,
	resetDesk,
	saveReview,
	sendReviewToAgent,
} from './routes/review.js'
import { stageFiles, stageOneChange, unstageFile } from './routes/staging.js'

import type { RouteTable } from './router.js'

// Per-desk route registry: `METHOD /path` → handler, paths from packages/contracts/src/routes.ts (the shared wire allowlist); a new route is an entry here plus its module.
// Dispatcher, origin/access guards and the 500 handler cover it with no further edits. Static assets and the hub's own API live with the dispatcher (router.ts), not here.
export const routes: RouteTable = {
	[`GET ${API_PATHS.poll}`]: servePoll,
	[`GET ${API_PATHS.state}`]: serveState,
	[`GET ${API_PATHS.settings}`]: serveSettings,
	[`POST ${API_PATHS.settings}`]: saveSettings,
	[`GET ${API_PATHS.tree}`]: serveTree,
	[`GET ${API_PATHS.file}`]: serveFile,
	[`GET ${API_PATHS.blob}`]: serveBlob,
	[`GET ${API_PATHS.fileContents}`]: serveFileContents,
	[`GET ${API_PATHS.inventory}`]: serveInventory,
	[`POST ${API_PATHS.openEditor}`]: openInEditor,
	[`POST ${API_PATHS.save}`]: saveReview,
	[`POST ${API_PATHS.send}`]: sendReviewToAgent,
	[`POST ${API_PATHS.ask}`]: askQuestion,
	[`GET ${API_PATHS.awaitSend}`]: awaitEvent,
	[`POST ${API_PATHS.reload}`]: reloadDeskFromRequest,
	[`POST ${API_PATHS.comment}`]: addComment,
	[`POST ${API_PATHS.status}`]: postStatus,
	[`POST ${API_PATHS.reset}`]: resetDesk,
	[`POST ${API_PATHS.stage}`]: stageFiles,
	[`POST ${API_PATHS.stageChange}`]: stageOneChange,
	[`POST ${API_PATHS.unstage}`]: unstageFile,
	[`POST ${API_PATHS.shutdown}`]: stopDesk,
}
