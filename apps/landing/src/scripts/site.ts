// Every page's runtime: responsive drawing frames, scene pausing, copyable
// commands, animated disclosures, then (once the fonts settled) the one-shot
// reveals. Each part no-ops when its markup is absent.
import { booted } from '@syneva/motion/boot'
import { bindDisclosures } from '@syneva/motion/disclosure'
import { armReveals } from '@syneva/motion/reveal'
import { syncScenes, watchScenes } from '@syneva/motion/scenes'

import { bindCommands } from '../components/command.client'

import { updateFrames } from './frames'

watchScenes()
bindCommands()
bindDisclosures()
await booted()
updateFrames()
armReveals()
syncScenes()
