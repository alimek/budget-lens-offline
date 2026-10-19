#!/usr/bin/env bash
# Reconcile the repository's GitHub labels with the canonical label set in labels.tsv.
#
# Mechanical sync with no LLM: the file is the source of truth, GitHub is the target. The script is idempotent -
# running it twice changes nothing on the second run. It only creates and edits labels; it deletes labels that are
# missing from labels.tsv when --prune is passed.
#
# Usage:
#   scripts/agents/sync-labels.sh [--dry-run] [--prune] [--repo OWNER/REPO] [--labels-file PATH]
#
# Environment:
#   BL_REPO               default repository (default: alimek/budget-lens-offline)
#   BL_LABELS_FILE        default canonical label file (default: labels.tsv next to this script)
#
# Exit codes: 0 success (also when nothing changed), 1 usage or validation error, 2 a gh call failed.
# Requires: gh (authenticated with the repo:scope to write labels), bash, awk, sort, mktemp.
#
# Scheduling on the Mac Studio - hourly, logs to ~/bl-logs (created by the entry):
#   15 * * * *  cd /Users/aliclaw/projects/budget-lens-offline && mkdir -p "$HOME/bl-logs" && \
#     scripts/agents/sync-labels.sh >> "$HOME/bl-logs/sync-labels.log" 2>&1
#
# launchd: the installed job is scripts/agents/launchd/com.aliclaw.bl-sync-labels.plist (install and uninstall
# commands in docs/agents.md).
#
# Part of #147 (save usage limits): label sync is a plain shell job, so no agent session burns tokens on it.
# See docs/agents.md.

set -euo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo="${BL_REPO:-alimek/budget-lens-offline}"
labels_file="${BL_LABELS_FILE:-$script_dir/labels.tsv}"
dry_run=0
prune=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --prune) prune=1 ;;
    --repo)
      [ $# -ge 2 ] || { echo "--repo needs a value" >&2; exit 1; }
      repo=$2
      shift
      ;;
    --labels-file)
      [ $# -ge 2 ] || { echo "--labels-file needs a value" >&2; exit 1; }
      labels_file=$2
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

command -v gh >/dev/null 2>&1 || { echo "gh is not installed" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh is not authenticated" >&2; exit 1; }
[ -f "$labels_file" ] || { echo "labels file not found: $labels_file" >&2; exit 1; }

case $repo in
  */*/* | */) echo "repo must be OWNER/REPO: $repo" >&2; exit 1 ;;
  */*) ;;
  *) echo "repo must be OWNER/REPO: $repo" >&2; exit 1 ;;
esac

current_file=$(mktemp)
desired_file=$(mktemp)
extra_file=$(mktemp)
cleanup() { rm -f "$current_file" "$desired_file" "$extra_file"; }
trap cleanup EXIT

# Canonical file: comment and blank lines are ignored; every row is name<TAB>color<TAB>description (the description
# may be empty, with or without its trailing tab).
awk -F'\t' '
  /^[[:space:]]*$/ || /^#/ { next }
  (NF != 2 && NF != 3) {
    printf "line %d: expected name<TAB>color<TAB>description, got: %s\n", NR, $0 > "/dev/stderr"; bad = 1; next
  }
  $1 == "" { printf "line %d: empty label name\n", NR > "/dev/stderr"; bad = 1; next }
  $2 !~ /^[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/ {
    printf "line %d: color must be six lowercase hex digits without #: %s\n", NR, $2 > "/dev/stderr"; bad = 1; next
  }
  { printf "%s\t%s\t%s\n", $1, $2, (NF == 3 ? $3 : "") }
  END { if (bad) exit 1 }
' "$labels_file" > "$desired_file" || exit 1

duplicates=$(cut -f1 "$desired_file" | sort | uniq -d)
if [ -n "$duplicates" ]; then
  printf 'duplicate label names in %s: %s\n' "$labels_file" "$(printf '%s' "$duplicates" | tr '\n' ' ')" >&2
  exit 1
fi

if ! gh api "repos/$repo" --jq '.full_name' >/dev/null; then
  echo "cannot read $repo with gh" >&2
  exit 2
fi

gh api "repos/$repo/labels" --paginate \
  --jq '.[] | [.name, .color, (.description // "")] | @tsv' > "$current_file"
created=0
deleted=0
updated=0
unchanged=0
failed=0
log() {
  if [ "$dry_run" -eq 1 ]; then
    printf 'dry-run: %s\n' "$*"
  else
    printf '%s\n' "$*"
  fi
}

run() {
  if [ "$dry_run" -eq 1 ]; then
    printf '  $ %s\n' "$*"
    return 0
  fi
  if ! "$@"; then
    failed=$((failed + 1))
    return 1
  fi
  return 0
}

while IFS=$'\t' read -r name color description; do
  [ -n "$name" ] || continue
  current=$(awk -F'\t' -v want="$name" '$1 == want { print $2 "\t" $3; exit }' "$current_file")
  if [ -z "$current" ]; then
    log "create label $name ($color) $description"
    if run gh label create "$name" --repo "$repo" --color "$color" --description "$description"; then
      created=$((created + 1))
    fi
    continue
  fi
  current_color=${current%%$'\t'*}
  current_description=${current#*$'\t'}
  if [ "$current_color" = "$color" ] && [ "$current_description" = "$description" ]; then
    unchanged=$((unchanged + 1))
    continue
  fi
  log "update label $name (color $current_color -> $color, description $current_description -> $description)"
  if run gh label edit "$name" --repo "$repo" --color "$color" --description "$description"; then
    updated=$((updated + 1))
  fi
done < "$desired_file"

awk -F'\t' 'NR == FNR { wanted[$1] = 1; next } !($1 in wanted) { print $1 }' "$desired_file" "$current_file" > "$extra_file"
extra_count=$(wc -l < "$extra_file" | tr -d '[:space:]')
while IFS= read -r name; do
  [ -n "$name" ] || continue
  if [ "$prune" -eq 1 ]; then
    if [ "$dry_run" -eq 1 ]; then
      log "would delete $name (not in $(basename "$labels_file"))"
    elif run gh label delete "$name" --repo "$repo" --yes; then
      printf 'deleted label %s (not in %s)\n' "$name" "$(basename "$labels_file")"
      deleted=$((deleted + 1))
    fi
  else
    printf 'unmanaged label on GitHub: %s (pass --prune to delete it)\n' "$name"
  fi
done < "$extra_file"

printf 'labels: %d created, %d updated, %d unchanged' "$created" "$updated" "$unchanged"
if [ "$prune" -eq 1 ]; then
  if [ "$dry_run" -eq 1 ]; then
    printf ', %d deleted (%d would be deleted)' "$deleted" "$extra_count"
  else
    printf ', %d deleted' "$deleted"
  fi
else
  printf ', %d unmanaged' "$extra_count"
fi
printf '\n'

if [ "$failed" -gt 0 ]; then
  printf '%d gh calls failed\n' "$failed" >&2
  exit 2
fi

