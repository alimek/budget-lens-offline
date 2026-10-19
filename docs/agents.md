# Agent team workflow

Rules that keep agent usage limits under control
([#147](https://github.com/alimek/budget-lens-offline/issues/147), part of #146). The idea is simple: **a label
carries work, and everything mechanical is a shell script**. An agent session starts only for work an issue
explicitly asks for; syncing labels and issue lists costs no tokens.

## Who acts when

| Agent | Trigger label | Acts when |
| --- | --- | --- |
| Developer | `agent:developer` | The issue carries the label and is not `status:blocked` (the issue → PR flow). |
| Tester | `agent:tester` | The issue or PR carries the label, or a PR needs a PASS/FAIL comment (#149). |
| Reviewer | – | A PR is open against `main`. |
| Designer | `agent:design` | **Only** when an issue carries `agent:design`. |
| Marketing | `agent:marketing` | **Only** when an issue carries `agent:marketing`. |
| Research | `agent:research` | **Only** when an issue carries `agent:research`. |

Hard rules for Designer, Marketing and Research:

- **The label is the only trigger.** No idle polling, no "while I am awake, look around" work, no speculative
  drafts. An agent whose queue file (below) is empty must finish without starting work.
- **Adding the label schedules the work; removing it stops it.** No other signal (a comment, a milestone, a guess
  from the title) starts these agents.
- Work they do must land as an artifact on the issue or PR (a comment, a doc, a screenshot), so the weekly routine
  review can see that the run produced something.

## Mechanical syncs (no LLM)

`scripts/agents/` holds plain `gh` + shell scripts, runnable by hand, from cron or from launchd on the Mac Studio.
Both are idempotent: the second run in a row changes nothing and exits 0.

- **`scripts/agents/sync-labels.sh` – `labels.tsv` is the source of truth for the label set.** It creates missing
  labels, edits the drifted ones (someone recoloured or reworded a label in the UI) and deletes labels missing from
  the file only with `--prune`. Change a label by editing `labels.tsv` in a PR; the next run applies it. `--dry-run`
  prints the `gh` calls it would make and touches nothing; `--prune` is off by default, so a first run against the
  existing repo is a no-op.
- **`scripts/agents/sync-issue-list.sh` – the per-agent work queues, read-only against GitHub.** For every `agent:*`
  label it writes `issues-<agent>.tsv` in `$BL_AGENT_STATE_DIR` (default `~/bl-agent-state`): one tab-separated row
  per open issue carrying that label (`number`, `updatedAt`, `labels`, `title`, `url`), sorted by issue number. The
  file is replaced only when its content changed, so its mtime answers "is there new work?" without an LLM, and an
  empty file means there is none.
- Sample cron entries are in the header of each script. Suggested cadence: labels hourly, queues every 15 minutes,
  logs in `~/bl-logs/`.

```sh
scripts/agents/sync-labels.sh --dry-run                       # what would change, nothing written
scripts/agents/sync-issue-list.sh --state-dir /tmp/bl-state   # queues into a scratch dir
```

### launchd jobs on the Mac Studio

The installed jobs are committed in `scripts/agents/launchd/`:

| Job | Runs | Every | Logs |
| --- | --- | --- | --- |
| `com.aliclaw.bl-sync-labels` | `sync-labels.sh` (no `--prune`) | 1 hour | `~/bl-logs/sync-labels.log`, `sync-labels.err.log` |
| `com.aliclaw.bl-sync-issue-list` | `sync-issue-list.sh` | 15 minutes | `~/bl-logs/sync-issue-list.log`, `sync-issue-list.err.log` |

Both run from a dedicated detached worktree, `/Users/aliclaw/projects/budget-lens-offline-sync`, so they never touch
the main clone's checkout. Before each run the labels job fetches `origin/main` and moves that worktree to it, so a
merged `labels.tsv` change is applied by the next hourly run; the queue job runs whatever the worktree has checked
out. Both set `PATH` with `/opt/homebrew/bin` first, so launchd finds `gh`, and use the `gh` login of the `aliclaw`
user.

Install (once, on the Mac Studio, as `aliclaw`):

```sh
git -C ~/projects/budget-lens-offline fetch origin
git -C ~/projects/budget-lens-offline worktree add --detach ~/projects/budget-lens-offline-sync origin/main
mkdir -p ~/bl-logs
cd ~/projects/budget-lens-offline-sync
scripts/agents/sync-labels.sh --dry-run   # review what the first run will change
for job in bl-sync-labels bl-sync-issue-list; do
  cp scripts/agents/launchd/com.aliclaw.$job.plist ~/Library/LaunchAgents/
  plutil -lint ~/Library/LaunchAgents/com.aliclaw.$job.plist
  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aliclaw.$job.plist
done
```

Check and uninstall:

```sh
launchctl print gui/$(id -u)/com.aliclaw.bl-sync-labels | grep 'last exit code'
launchctl kickstart gui/$(id -u)/com.aliclaw.bl-sync-issue-list   # run now
for job in bl-sync-labels bl-sync-issue-list; do
  launchctl bootout gui/$(id -u)/com.aliclaw.$job
  rm ~/Library/LaunchAgents/com.aliclaw.$job.plist
done
```

## Standing routines and the weekly review

A routine is anything that starts an agent on a schedule (a launchd job, a cron entry, a scheduler task).

- **Weekly review rule: a routine that produced no output in the last 7 days is disabled.** Disabled means removed
  from the schedule, not left running "just in case". Re-enable it by adding it again when a label actually needs
  it.
- **Output** means an artifact a human or another agent can read: a PR, an issue or PR comment, a label change, a
  doc or log entry. A run that only reported "nothing to do" counts as no output.
- The review is run by the **orchestrator** once a week and records the kept/disabled list in `docs/agents.md`
  under *Routine review log* below. When #151 lands, `~/bl-logs/runs.jsonl` is the input (one JSON line per run with
  `agent`, `timestamp`, `issue`, `result`), so the review is a filter over that file rather than an LLM reading
  transcripts.
- Reviewer, Tester and Developer triggers stay: they are event-driven (an issue label, an open PR), not polling.

### Routine review log

The first review was done on 2026-10-19 ([PR #161 comment](https://github.com/alimek/budget-lens-offline/pull/161#issuecomment-6276904169)). Later reviews run in the orchestrator's Monday `BL weekly report`.

| Date | Routine | Decision | Evidence |
| --- | --- | --- | --- |
| 2026-10-19 | All 4 orchestrator routines (`BL weekly report`, `BL team heartbeat`, `BL daily dev-review retro`, `BL new PR handoff`) | Keep all unchanged. Reviewed by the orchestrator, decided by Grzegorz Mandziak. The weekly review now runs in the orchestrator's Monday report. | [PR #161 comment](https://github.com/alimek/budget-lens-offline/pull/161#issuecomment-6276904169) |

## Label descriptions

All label descriptions in `labels.tsv` are in English, including the `stage:*` labels and every `agent:*` label.
