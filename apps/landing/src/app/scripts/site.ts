// Every page's runtime: responsive drawing frames, scene pausing, copyable
// commands, animated disclosures, then (once the fonts settled) the one-shot
// reveals. Each part no-ops when its markup is absent.

import { bindCommands } from '@features/copy-command/model/command.client'
import { updateFrames } from '@shared/ui/drawing/frames'
import { booted } from '@syneva/motion/boot'
import { bindDisclosures } from '@syneva/motion/disclosure'
import { armReveals } from '@syneva/motion/reveal'
import { syncScenes, watchScenes } from '@syneva/motion/scenes'

watchScenes()
bindCommands()
bindDisclosures()
await booted()
updateFrames()
armReveals()
syncScenes()
