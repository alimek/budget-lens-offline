# GitHub automation scripts

`scripts/github/` holds two small, portable `gh` + shell scripts that keep the repository's GitHub metadata in a
known state. They run from any clone (macOS or Linux, Bash 3.2+), by hand or from any scheduler, and contain no
machine-specific paths or users. Both are idempotent: a second run in a row changes nothing and exits 0.

| Script | What it does | GitHub access |
| --- | --- | --- |
| `sync-labels.sh` | Reconciles the repository labels with `scripts/github/labels.tsv` | Issues: read and write |
| `sync-issue-list.sh` | Exports one local queue file per label with the open issues carrying it | Issues: read |

## Label sync from `labels.tsv`

`scripts/github/labels.tsv` is the source of truth for the label set: one label per line,
`name<TAB>color<TAB>description`, color as six lowercase hex digits without `#`, description up to 100
characters. Change a label by editing this file in a PR.

`sync-labels.sh` creates missing labels and edits drifted ones (a label recoloured or reworded in the UI). Labels
that exist on GitHub but not in the file are reported as *unmanaged* and left alone; they are deleted only with
`--prune`, which is a manual, reviewed step and never part of a scheduled run. `--dry-run` prints the `gh` calls it
would make and changes nothing.

```sh
export GH_TOKEN=...                          # fine-grained token, see "Tokens" below
scripts/github/sync-labels.sh --dry-run      # what would change, nothing written
scripts/github/sync-labels.sh                # apply
```

## Per-label issue queue export

`sync-issue-list.sh --labels a,b` writes `issues-<label>.tsv` for every listed label into the state directory
(`--state-dir`, `$BL_QUEUE_DIR`, default `${XDG_STATE_HOME:-~/.local/state}/budget-lens`). The labels can also come
from `$BL_QUEUE_LABELS`; there is no built-in default. Each file has one tab-separated row per open issue carrying
that label (`number`, `updatedAt`, `labels`, `title`, `url`), sorted by issue number. Characters outside
`[A-Za-z0-9._-]` in the label become `-` in the file name (`type:task` → `issues-type-task.tsv`).

A file is replaced atomically and only when its content changed, so its mtime tells a consumer whether the queue
changed without calling the API, and an empty file means no open issue carries the label. The script is read-only
against GitHub and warns about labels that do not exist in the repository.

```sh
export GH_TOKEN=...                          # read-only token
scripts/github/sync-issue-list.sh --labels type:task,status:ready --state-dir /tmp/queues
```

## Tokens

Both scripts take auth only from `GH_TOKEN`. When it is unset they exit 1 with a clear error before any `gh` call;
they never fall back to a `gh auth login` session, so a scheduled job cannot silently run with a broad personal
login. Use one fine-grained personal access token per job (GitHub → Settings → Developer settings → Personal
access tokens → Fine-grained tokens):

| Setting | `sync-labels.sh` | `sync-issue-list.sh` |
| --- | --- | --- |
| Resource owner | the repository owner | the repository owner |
| Repository access | Only select repositories → this repository | same |
| Repository permissions | **Issues: Read and write**, Metadata: Read-only | **Issues: Read-only**, Metadata: Read-only |
| Account permissions | none | none |
| Expiration | set one (for example 90 days) and renew it | same |

Creating and editing labels (`POST /repos/{owner}/{repo}/labels`, `PATCH /repos/{owner}/{repo}/labels/{name}`)
needs Issues: write; listing labels and open issues needs Issues: read. Metadata: read is always included. Keep the
token in a secret store (an OS keychain, a CI secret) and have the job's own wrapper put it into `GH_TOKEN` for that
process only; never commit it or write it to a log.

## Scheduling

Any scheduler works: cron, a systemd timer, a macOS launch agent or a CI schedule. The repository ships no
scheduler configuration; the job definitions, the token store and the log paths belong to whoever operates the
machine.

- **Consent:** installing, updating, re-enabling or re-installing a scheduled job for this repository needs the
  repo owner's explicit consent. The owner sets the job up, or someone else does it only after the owner's approval
  is recorded on the PR or issue, naming the commit or tag to run. Merging a PR never installs or updates a job.
- **Pinned, reviewed code (recommended):** run the scripts from a checkout of one reviewed commit or tag, for
  example a detached `git worktree` of a merged SHA, not from a moving branch. The job must not `git fetch`,
  `checkout`, `pull` or `reset` itself (the scripts never do); moving to a newer commit is a re-install and needs
  the owner's consent.
- **No `--prune`** in a scheduled `sync-labels.sh` run.
- **Cadence and logs:** labels hourly and queues every 15 minutes are enough. Keep logs bounded (rotate them).

Example with cron (`<pinned-checkout>` and `<read … token>` are the operator's):

```sh
# m h dom mon dow  command
15 * * * *    cd <pinned-checkout> && GH_TOKEN="$(<read labels token>)" scripts/github/sync-labels.sh
*/15 * * * *  cd <pinned-checkout> && GH_TOKEN="$(<read queue token>)" scripts/github/sync-issue-list.sh --labels type:task
```

To uninstall, remove the job from the scheduler (delete the cron line, unload the launch agent, disable the systemd
timer) and revoke its token on GitHub. Re-enabling a removed job is an install and needs the owner's consent like
any other.
