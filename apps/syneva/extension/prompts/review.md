---
description: Review the current branch in Syneva — live browser desk, act on the reviewer's sends
argument-hint: "[ref|focused] [focus notes]"
---
Run an interactive code review of a branch through **Syneva** (a browser review desk; the human accepts/rejects changes and clicks Send to Agent, you act and reply in the same tab). The desk stays live across rounds — never treat one send as the end.

Arguments ($@): a branch name, PR number, or GitHub URL to review (default: the current branch via `git branch --show-current`, detached HEAD → ask what to review), optionally the word `focused` (keep the guide to what the reviewer must judge), and remaining words are focus instructions for the guide. If no argument makes sense, proceed with the default.

Treat **`syneva spec`** as the authoritative contract — run it once before your first Syneva review this session (modes, await/comment/reload loop, ReviewResult, guide schema). `syneva` is installed by the syneva pi package (shim in `~/.pi/agent/bin`); if it is missing, tell the user and offer the upstream fallback `pnpm add -g syneva`.

1. **Pick the mode.** Fixed target is pr mode: `syneva pr <ref>` — the branch's commits vs its merge-base.
   - If `ref` was given explicitly, use it (Syneva validates the guide against the branch's diff, then checks the branch out; it aborts on a dirty tree).
   - If the working tree is **clean** → go to step 2.
   - If the working tree has **uncommitted tracked changes** (default is to include them in the branch review): ask the user with `ask_user_question`, options:
     a. Commit the changes as one WIP commit (`git add -A` + `git commit -m "wip: …"`), then review the whole branch including it;
     b. Stash the changes, review only the committed branch;
     c. Review only the uncommitted working-tree changes now (`syneva`, repo mode) and skip branch commits.
     Never commit, stash, or checkout without the user's explicit choice.
2. **Open the desk on the hub** and capture its output (the command returns at once; the hub starts in the background when none runs). A pr or repo desk opens on a draft of its guide, drawn by Syneva from the code's structure - the reviewer can start reading at once:
   ```bash
   syneva open pr ${1:-$(git branch --show-current)} | tee /tmp/syneva-<slug>.json
   url=$(jq -r .url /tmp/syneva-<slug>.json); echo "${url:-open failed - read the command's stderr}"
   ```
   Adjust the command line to the decisions above (e.g. repo mode `syneva open`). Report the printed URL (and the `dashboard` URL) to the user. `outcome: "reloaded"` means the desk was already open: its tab updated by itself.
3. **Explain the guide.** The open's JSON names `guide` (the guide.json to fill, in a folder of its own outside the working tree) and `pending` (each domain waiting for your words, with its `packet`). The authoring workflow and rules of `syneva spec` apply; the packets carry the rules a domain needs.
   - Launch one `syneva-explain` subagent per pending domain with the `subagent` tool, all at once (async), each with the task `Explain domain <id>. Packet: <packet>. Guide: <guide>. Write: <guide folder>/explained/<name>.json`, where `<name>` is the packet's file name without `.md` (unique and safe on every file system, which a raw id is not). Never explain the domains one after another yourself: they are independent.
   - With no `pending` domain and no `overviewDrafted`, the guide is complete: skip this step.
   - When they are all done, merge their files and post once. When `overviewDrafted`, write the overview (what the changeset does and why, from the domains' titles and risks); otherwise pass it empty to keep the desk's. Nothing is posted when no subagent wrote a file and the overview is kept, and the reload runs only once the merge succeeded:
     ```bash
     guide=$(jq -r .guide /tmp/syneva-<slug>.json); dir=$(dirname "$guide"); overview="<overview>"
     set -- "$dir"/explained/*.json; [ -e "$1" ] || set --
     if [ $# -gt 0 ] || [ -n "$overview" ]; then
       jq -s --arg overview "$overview" '.[0] + {overview: (if $overview == "" then .[0].overview else $overview end), domains: [.[1:][][]]}' "$guide" "$@" > "$dir/posted.json" && syneva reload --guide "$dir/posted.json"
     fi
     ```
     A domain the post leaves out stays as it is: a subagent that failed leaves its domain pending, explain it again. A refusal names the field - fix it in that domain's file and post again, never pad the guide. With `focused`, say so in the overview and tell each subagent to keep its explanation to what the reviewer must judge.
4. **Attach the owning Pi session** with `syneva_agent` as documented in `syneva spec`, then return control. Never delegate waiting to a one-shot subagent. If the tool is unavailable, report the missing native attachment rather than claim the desk will wake an idle agent. Incoming native messages point to the complete event JSON; read it before handling the event:
   - Questions follow the **Question routing** section of `syneva spec`. The desk correspondent answers them; handle only explicit correspondent failures here, not questions still being answered.
   - `review` event: act on the ReviewResult one item per path, don't mix: `rejected` → revert that change; `requestedChanges` → make the edit at path/lineNumber; `accepted`/`approvedFiles`/`stagedFiles` → leave alone; `openQuestions` → answer each read-only first. In pr mode edits are amendments to the branch commits, not working-tree edits — do it, then `syneva reload` to re-diff into the same tab. A domain whose code your edits moved comes back from that reload in `pending` as "stale", with its packet: explain it again in the rewritten guide.json and post it (`syneva reload --guide <guide>`, same domain ids). For anything ambiguous (conflicting verdicts, outside-scope change), ask the user in chat.
   - After handling any event, return control: the native listener remains attached and delivers further events automatically. Keep posting `status` lines through long work.
5. **End state.** `syneva reload` after your edits against the re-checks if the reviewer requested tests; keep looping until the human approves everything or says done. When the review is over: detach with `syneva_agent`, then run `syneva close` (idempotent; the hub keeps running) and summarize in chat: approvals left, changes applied, branch state.
