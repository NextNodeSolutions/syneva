import { handleRequest } from './api/handle-request'

import type { WorkerEnvironment } from './environment'

export default {
	fetch: (request, env) => handleRequest(request, env),
} satisfies ExportedHandler<WorkerEnvironment>
