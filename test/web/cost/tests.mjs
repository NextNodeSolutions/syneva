// The tests in RFC order; each module exports { id, title, where, run, dryRun? }.
import { t1 } from './t1-hibernation.mjs'
import { t2 } from './t2-flood.mjs'
import { t3 } from './t3-reconnect-storm.mjs'
import { t4 } from './t4-relay-bounds.mjs'
import { t5 } from './t5-memory.mjs'
import { t6 } from './t6-breaker-app.mjs'
import { t7 } from './t7-deploy-drill.mjs'
import { t8 } from './t8-log-volume.mjs'
import { t9 } from './t9-free-pages.mjs'
import { t10 } from './t10-breaker-edge.mjs'

export const TESTS = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10]
