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
2. **Author the guide** against the inventory: `syneva inventory pr <ref>` (the same ref and flags as the open; nothing is checked out) prints the review source - its fingerprint, files and changed units are what the guide names. Read the changed code around them and write the guide JSON to `/tmp/syneva-guide-<ref|branch>.json`, OUTSIDE the working tree, following the guide section of `syneva spec` - the schema, the limits and the authoring workflow and rules (grouping, risk, forms, references, what to verify) live there, not here. With `focused`, say so in the overview and keep the explanations to what the reviewer must judge. A validation refusal names the field - fix the field, never pad the guide.
3. **Open the desk on the hub** with the guide (a pr or repo desk opens only with one) and capture its URL (the command returns at once; the hub starts in the background when none runs):
   ```bash
   syneva open pr ${1:-$(git branch --show-current)} --guide /tmp/syneva-guide-<ref|branch>.json | tee /tmp/syneva-<slug>.json
   url=$(jq -r .url /tmp/syneva-<slug>.json); echo "${url:-open failed - read the command's stderr}"
   ```
   Adjust the command line to the decisions above (e.g. repo mode `syneva open` with the guide file). Report the printed URL (and the `dashboard` URL) to the user. `outcome: "reloaded"` means the desk was already open: its tab updated by itself.
4. **Attach the owning Pi session** with `syneva_agent` as documented in `syneva spec`, then return control. Never delegate waiting to a one-shot subagent. If the tool is unavailable, report the missing native attachment rather than claim the desk will wake an idle agent. Incoming native messages point to the complete event JSON; read it before handling the event:
   - Questions follow the **Question routing** section of `syneva spec`. The desk correspondent answers them; handle only explicit correspondent failures here, not questions still being answered.
   - `review` event: act on the ReviewResult one item per path, don't mix: `rejected` → revert that change; `requestedChanges` → make the edit at path/lineNumber; `accepted`/`approvedFiles`/`stagedFiles` → leave alone; `openQuestions` → answer each read-only first. In pr mode edits are amendments to the branch commits, not working-tree edits — do it, then `syneva reload` to re-diff into the same tab. When your edits touch code a domain owns or context it cites, take the inventory again and `syneva reload --guide <updated file>` (same domain ids) so the explanations are current - a plain reload only marks them stale. For anything ambiguous (conflicting verdicts, outside-scope change), ask the user in chat.
   - After handling any event, return control: the native listener remains attached and delivers further events automatically. Keep posting `status` lines through long work.
5. **End state.** `syneva reload` after your edits against the re-checks if the reviewer requested tests; keep looping until the human approves everything or says done. When the review is over: detach with `syneva_agent`, then run `syneva close` (idempotent; the hub keeps running) and summarize in chat: approvals left, changes applied, branch state.
