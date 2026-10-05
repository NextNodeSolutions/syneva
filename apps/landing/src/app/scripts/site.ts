// Every page's runtime: responsive drawing frames, scene pausing, copyable
// commands, animated disclosures, the signup forms, then (once the fonts
// settled) the one-shot reveals. Each part no-ops when its markup is absent.

import { bindCommands } from '@features/copy-command/model/command.client'
import { bindDisclosures } from '@features/disclosure/model/disclosure.client'
import { bindSignups } from '@features/subscribe/model/signup.client'
import { watchFrames } from '@shared/ui/drawing/frames'
import { booted } from '@syneva/motion/boot'
import { armReveals } from '@syneva/motion/reveal'
import { syncScenes, watchScenes } from '@syneva/motion/scenes'

watchFrames()
watchScenes()
bindCommands()
bindDisclosures()
bindSignups()
await booted()
armReveals()
syncScenes()
