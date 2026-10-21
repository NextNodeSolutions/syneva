// The tests in RFC order; each module exports { id, title, where, run, dryRun? }.
import { t2 } from './t2-flood.mjs'
import { t4 } from './t4-relay-bounds.mjs'
import { t5 } from './t5-memory.mjs'

export const TESTS = [t2, t4, t5]
