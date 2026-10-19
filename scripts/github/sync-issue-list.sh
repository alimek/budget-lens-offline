#!/usr/bin/env bash
# Export per-label issue queues from GitHub: one local file per label with the open issues that carry it.
#
# For every label in --labels the script writes <state-dir>/issues-<label>.tsv with the open issues that carry that
# label (one row per issue, sorted by issue number). An empty file means no open issue carries the label.
#
# Read-only against GitHub - the script never writes issues or labels. It writes only local files, atomically, and
# only when the content actually changed, so the file mtime answers "did the queue change?" without calling the API.
#
# Usage:
#   scripts/github/sync-issue-list.sh --labels a,b [--state-dir DIR] [--repo OWNER/REPO]
#
# Environment:
#   GH_TOKEN          read-only fine-grained token used for every gh call (required, see Auth)
#   BL_REPO           default repository (default: alimek/budget-lens-offline)
#   BL_QUEUE_DIR      default output directory (default: ${XDG_STATE_HOME:-$HOME/.local/state}/budget-lens)
#   BL_QUEUE_LABELS   default comma-separated labels (no default; --labels or BL_QUEUE_LABELS is required)
#
# Queue columns (tab-separated): number, updatedAt, labels (comma-separated), title, url.
# Exit codes: 0 success, 1 usage or missing-token error, 2 a gh call failed.
# Requires: gh, bash, sort, cmp, mktemp.
#
# Auth: GH_TOKEN must hold a read-only fine-grained token scoped to this repository only, with Issues: read and
# Metadata: read. If GH_TOKEN is unset the script fails closed; it never falls back to a gh login.
#
# Scheduling: any scheduler (cron, a systemd timer, a CI schedule) can run this. A scheduled job must run
# only from a checkout of one reviewed commit or tag, never from a branch or a working clone, and must never
# git fetch or check out itself. Installing, updating (a re-install) or re-enabling a scheduled job for this
# repo needs the repo owner's explicit consent. See docs/github-automation.md.

set -euo pipefail

repo="${BL_REPO:-alimek/budget-lens-offline}"
state_dir="${BL_QUEUE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/budget-lens}"
labels="${BL_QUEUE_LABELS:-}"

usage() {
  awk 'NR > 1 && /^# Auth:/ { exit } NR > 1' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --state-dir)
      [ $# -ge 2 ] || { echo "--state-dir needs a value" >&2; exit 1; }
      state_dir=$2
      shift
      ;;
    --repo)
      [ $# -ge 2 ] || { echo "--repo needs a value" >&2; exit 1; }
      repo=$2
      shift
      ;;
    --labels)
      [ $# -ge 2 ] || { echo "--labels needs a value" >&2; exit 1; }
      labels=$2
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

command -v gh >/dev/null 2>&1 || { echo "gh is not installed" >&2; exit 1; }
if [ -z "${GH_TOKEN:-}" ]; then
  echo "error: GH_TOKEN is not set. Export a read-only fine-grained token scoped to this repository (Issues: read," >&2
  echo "Metadata: read); see docs/github-automation.md. Not falling back to the gh login." >&2
  exit 1
fi
[ -n "$labels" ] || { echo "no labels to sync: pass --labels a,b or set BL_QUEUE_LABELS" >&2; exit 1; }

case $repo in
  */*/* | */) echo "repo must be OWNER/REPO: $repo" >&2; exit 1 ;;
  */*) ;;
  *) echo "repo must be OWNER/REPO: $repo" >&2; exit 1 ;;
esac

mkdir -p "$state_dir"

label_list=$(mktemp)
known_labels=$(mktemp)
# The queue temp file lives in the state dir, so the final mv is an atomic rename on the same filesystem.
tmp=$(mktemp "$state_dir/.issues.XXXXXX")
cleanup() { rm -f "$label_list" "$known_labels" "$tmp"; }
trap cleanup EXIT
printf '%s\n' "$labels" | tr ',' '\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | grep -v '^$' > "$label_list"

# A label that does not exist on GitHub also yields an empty queue, so say so instead of looking idle.
gh api "repos/$repo/labels" --paginate --jq '.[].name' > "$known_labels"
while IFS= read -r label; do
  awk -v want="$label" -F'\t' '$1 == want { found = 1; exit } END { exit !found }' "$known_labels" ||
    printf 'warning: %s is not a label of %s\n' "$label" "$repo" >&2
done < "$label_list"

updated=0
unchanged=0
failed=0
while IFS= read -r label; do
  [ -n "$label" ] || continue
  # Keep the file name inside the state dir: anything outside [A-Za-z0-9._-] (":" and "/" included) becomes "-".
  slug=$(printf '%s' "$label" | tr -c 'A-Za-z0-9._-' '-')
  target="$state_dir/issues-$slug.tsv"
  : > "$tmp"
  if ! gh issue list --repo "$repo" --state open --label "$label" --limit 500 \
    --json number,updatedAt,labels,title,url \
    --jq '.[] | [(.number | tostring), .updatedAt, ([.labels[].name] | join(",")), (.title | gsub("\t"; " ")), .url] | @tsv' \
    | sort -n > "$tmp"; then
    printf 'failed to read open issues with %s\n' "$label" >&2
    failed=$((failed + 1))
    continue
  fi

  count=$(wc -l < "$tmp" | tr -d '[:space:]')
  [ "$count" -lt 500 ] || printf 'warning: %s has 500+ open issues, the queue is truncated at 500\n' "$label" >&2
  if [ -f "$target" ] && cmp -s "$tmp" "$target"; then
    unchanged=$((unchanged + 1))
    printf '%s: %s - unchanged (%s open issues)\n' "$label" "$target" "$count"
  else
    chmod 644 "$tmp"
    mv "$tmp" "$target"
    updated=$((updated + 1))
    printf '%s: %s - updated (%s open issues)\n' "$label" "$target" "$count"
  fi
done < "$label_list"

printf 'queues: %d updated, %d unchanged\n' "$updated" "$unchanged"

if [ "$failed" -gt 0 ]; then
  printf '%d gh calls failed\n' "$failed" >&2
  exit 2
fi
