import { bindCommands } from '@features/copy-command/model/command.client'
import { bindDisclosures } from '@features/disclosure/model/disclosure.client'
import { watchFrames } from '@shared/ui/drawing/frames'
import { armReveals } from '@syneva/motion/reveal'
import { watchScenes } from '@syneva/motion/scenes'

watchFrames()
watchScenes()
bindCommands()
bindDisclosures()
armReveals()
