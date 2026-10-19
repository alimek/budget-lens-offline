#!/usr/bin/env bash
# Materialise the per-agent work queues from GitHub, so an agent reads a file instead of polling with an LLM.
#
# For every agent label the script writes <state-dir>/issues-<label>.tsv with the open issues that carry that label
# (one row per issue, sorted by issue number). This is the gate from #147: Designer, Marketing and Research act only
# when an issue carries their label, so an empty queue means "nothing to do, do not start a session".
#
# Read-only against GitHub - the script never writes issues or labels. It writes only local files, atomically, and
# only when the content actually changed, so the file mtime answers "is there new work?" without an LLM.
#
# Usage:
#   scripts/agents/sync-issue-list.sh [--state-dir DIR] [--repo OWNER/REPO] [--labels a,b]
#
# Environment:
#   BL_REPO              default repository (default: alimek/budget-lens-offline)
#   BL_AGENT_STATE_DIR   default output directory (default: $HOME/bl-agent-state)
#   BL_AGENT_LABELS      default comma-separated labels (default: the agent:* labels)
#
# Queue columns (tab-separated): number, updatedAt, labels (comma-separated), title, url.
# Exit codes: 0 success, 1 usage error, 2 a gh call failed.
# Requires: gh (authenticated, read access is enough), bash, sort, cmp, mktemp.
#
# Scheduling on the Mac Studio - every 15 minutes, logs to ~/bl-logs (created by the entry):
#   */15 * * * *  cd /Users/aliclaw/projects/budget-lens-offline && mkdir -p "$HOME/bl-logs" && \
#     scripts/agents/sync-issue-list.sh >> "$HOME/bl-logs/sync-issue-list.log" 2>&1
#
# For the launchd equivalent, copy the plist sample in sync-labels.sh and change the label, the program argument
# and the log path.
#
# Part of #147 (save usage limits). See docs/agents.md.

set -euo pipefail

repo="${BL_REPO:-alimek/budget-lens-offline}"
state_dir="${BL_AGENT_STATE_DIR:-$HOME/bl-agent-state}"
labels="${BL_AGENT_LABELS:-agent:design,agent:developer,agent:marketing,agent:research,agent:tester}"

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
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
gh auth status >/dev/null 2>&1 || { echo "gh is not authenticated" >&2; exit 1; }
[ -n "$labels" ] || { echo "no labels to sync" >&2; exit 1; }

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
