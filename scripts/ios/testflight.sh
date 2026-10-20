#!/usr/bin/env bash
# Local iOS release build and TestFlight upload (#176). Runs on a macOS dev machine with Xcode and CocoaPods.
# Docs: docs/release/testflight.md. Native builds never run in CI (docs/ci.md#native-builds-and-e2e-local).
#
# Secrets policy: the App Store Connect API key is read only from environment variables (ASC_KEY_ID, ASC_ISSUER_ID,
# ASC_KEY_PATH). This script never prints key material or identifiers; it only reports whether a variable is set,
# and it fails closed when anything required is missing. Do not add `set -x`.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/ios/testflight.sh <command> [options]

Commands:
  build      expo prebuild (iOS) -> xcodebuild archive (Release) -> export a signed App Store Connect IPA
  upload     upload the exported IPA to App Store Connect (TestFlight) with xcrun altool
  release    build, then upload

Options:
  --unsigned       build only: archive in Release with code signing disabled (compile check, no IPA, no env needed)
  --skip-prebuild  build only: reuse the existing apps/mobile/ios project instead of regenerating it
  --ipa <path>     upload only: the IPA to upload (default: the newest IPA in the export directory)
  --dry-run        print the planned steps and the env status (set/missing, never values), run nothing
  -h, --help       show this help

Environment (values are never printed):
  APPLE_TEAM_ID          Apple Developer team ID (signed build)
  ASC_KEY_ID             App Store Connect API key ID (signed build, upload)
  ASC_ISSUER_ID          App Store Connect API issuer ID (signed build, upload)
  ASC_KEY_PATH           path to the AuthKey_<id>.p8 file, outside the repository (signed build, upload)
  IOS_BUNDLE_IDENTIFIER  optional override of ios.bundleIdentifier from apps/mobile/app.json
  IOS_BUILD_NUMBER       optional CFBundleVersion; default: UTC YYYYMMDD.HHMM.SS, each part an integer
                         without leading zeros (09:05:07 -> 20261020.905.7)
  IOS_BUILD_DIR          optional output directory outside the repository or under apps/mobile/build/
                         (gitignored); default: apps/mobile/build/ios
USAGE
}

log() { printf '==> %s\n' "$*"; }
die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$REPO_ROOT/apps/mobile"
BUILD_DIR="${IOS_BUILD_DIR:-$APP_DIR/build/ios}"
ARCHIVE_PATH="$BUILD_DIR/BudgetLens.xcarchive"
EXPORT_DIR="$BUILD_DIR/export"
LOG_DIR="$BUILD_DIR/logs"

# Temporary directory with the API key link (upload only). Script-level so that the EXIT trap still sees it after
# upload() has returned; the guard keeps the trap safe under `set -u` when no upload ran.
KEYS_DIR=""
cleanup() {
  if [[ -n ${KEYS_DIR:-} ]]; then
    rm -rf -- "$KEYS_DIR"
  fi
  KEYS_DIR=""
}
trap cleanup EXIT

COMMAND="${1:-}"
[ -n "$COMMAND" ] || {
  usage
  exit 1
}
shift
case "$COMMAND" in
  build | upload | release) ;;
  -h | --help)
    usage
    exit 0
    ;;
  *) die "unknown command '$COMMAND' (see --help)" ;;
esac

DRY_RUN=0
UNSIGNED=0
SKIP_PREBUILD=0
IPA_PATH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --unsigned) UNSIGNED=1 ;;
    --skip-prebuild) SKIP_PREBUILD=1 ;;
    --ipa)
      [ $# -ge 2 ] || die "--ipa needs a path"
      IPA_PATH="$2"
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) die "unknown option '$1' (see --help)" ;;
  esac
  shift
done

[ "$UNSIGNED" -eq 0 ] || [ "$COMMAND" = "build" ] || die "--unsigned is only valid with 'build' (an unsigned build cannot be uploaded)"
[ "$SKIP_PREBUILD" -eq 0 ] || [ "$COMMAND" != "upload" ] || die "--skip-prebuild is only valid with 'build' or 'release'"
[ -z "$IPA_PATH" ] || [ "$COMMAND" = "upload" ] || die "--ipa is only valid with 'upload'"

DO_BUILD=0
DO_UPLOAD=0
case "$COMMAND" in
  build) DO_BUILD=1 ;;
  upload) DO_UPLOAD=1 ;;
  release)
    DO_BUILD=1
    DO_UPLOAD=1
    ;;
esac

# --- Environment checks (fail closed; report names only) -------------------------------------------------------

REQUIRED_VARS=()
if [ "$DO_BUILD" -eq 1 ] && [ "$UNSIGNED" -eq 0 ]; then
  REQUIRED_VARS+=(APPLE_TEAM_ID ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH)
elif [ "$DO_UPLOAD" -eq 1 ]; then
  REQUIRED_VARS+=(ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH)
fi

PROBLEMS=()
check_env() {
  local name
  # "${REQUIRED_VARS[@]+...}" keeps an empty array safe under `set -u` on macOS bash 3.2.
  for name in ${REQUIRED_VARS[@]+"${REQUIRED_VARS[@]}"}; do
    if [ -z "${!name:-}" ]; then
      PROBLEMS+=("$name is not set")
    fi
  done
  if [ -n "${APPLE_TEAM_ID:-}" ] && ! [[ "$APPLE_TEAM_ID" =~ ^[A-Z0-9]{10}$ ]]; then
    PROBLEMS+=("APPLE_TEAM_ID does not look like a 10-character team ID")
  fi
  if [ -n "${ASC_KEY_ID:-}" ] && ! [[ "$ASC_KEY_ID" =~ ^[A-Z0-9]{8,12}$ ]]; then
    PROBLEMS+=("ASC_KEY_ID does not look like an App Store Connect key ID")
  fi
  if [ -n "${ASC_ISSUER_ID:-}" ] && ! [[ "$ASC_ISSUER_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
    PROBLEMS+=("ASC_ISSUER_ID does not look like an issuer UUID")
  fi
  if [ -n "${ASC_KEY_PATH:-}" ]; then
    if [ ! -f "$ASC_KEY_PATH" ] || [ ! -r "$ASC_KEY_PATH" ]; then
      PROBLEMS+=("ASC_KEY_PATH does not point to a readable file")
    else
      local key_dir
      key_dir="$(cd "$(dirname "$ASC_KEY_PATH")" && pwd -P)"
      case "$key_dir/" in
        "$(cd "$REPO_ROOT" && pwd -P)/"*) PROBLEMS+=("ASC_KEY_PATH must point outside the repository") ;;
      esac
    fi
  fi
  if [ -n "${IOS_BUILD_DIR:-}" ]; then
    check_build_dir
  fi
  if [ -n "${IOS_BUILD_NUMBER:-}" ] && ! [[ "$IOS_BUILD_NUMBER" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]]; then
    PROBLEMS+=("IOS_BUILD_NUMBER must be one to three period-separated integers")
  fi
}

# Absolute, symlink-resolved form of a path that may not exist yet (resolves the nearest existing ancestor).
resolve_path() {
  local path="$1" rest=""
  [[ $path == /* ]] || path="$PWD/$path"
  while [ ! -d "$path" ]; do
    rest="/$(basename "$path")$rest"
    path="$(dirname "$path")"
  done
  printf '%s%s' "$(cd "$path" && pwd -P)" "$rest"
}

# IOS_BUILD_DIR holds ExportOptions.plist (with the team ID) and logs: inside the repository only the gitignored
# apps/mobile/build/ is allowed.
check_build_dir() {
  local resolved repo
  case "/$IOS_BUILD_DIR/" in
    */../*)
      PROBLEMS+=("IOS_BUILD_DIR must not contain '..'")
      return
      ;;
  esac
  resolved="$(resolve_path "$IOS_BUILD_DIR")"
  repo="$(cd "$REPO_ROOT" && pwd -P)"
  case "$resolved/" in
    "$repo/apps/mobile/build/"*) ;;
    "$repo/"*) PROBLEMS+=("IOS_BUILD_DIR inside the repository must be under apps/mobile/build/ (gitignored)") ;;
  esac
}

env_status() {
  local name
  for name in APPLE_TEAM_ID ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH IOS_BUNDLE_IDENTIFIER IOS_BUILD_NUMBER IOS_BUILD_DIR; do
    if [ -n "${!name:-}" ]; then
      printf '    %-22s set\n' "$name"
    else
      printf '    %-22s not set\n' "$name"
    fi
  done
}

check_tools() {
  local tool
  [ "$(uname -s)" = "Darwin" ] || PROBLEMS+=("iOS builds need macOS with Xcode")
  for tool in xcodebuild xcrun pnpm; do
    command -v "$tool" >/dev/null 2>&1 || PROBLEMS+=("'$tool' is not on PATH")
  done
  if [ "$DO_BUILD" -eq 1 ] && [ "$SKIP_PREBUILD" -eq 0 ]; then
    command -v pod >/dev/null 2>&1 || PROBLEMS+=("CocoaPods ('pod') is not on PATH")
  fi
}

default_build_number() {
  # UTC YYYYMMDD.HHMM.SS with every part written as an integer (no leading zeros, 09:05:07 -> 20261020.905.7):
  # a valid CFBundleVersion (up to three period-separated integers), increasing and unique per second.
  local stamp day hhmm ss
  stamp="$(date -u +%Y%m%d.%H%M.%S)"
  day="${stamp%%.*}"
  hhmm="${stamp#*.}"
  hhmm="${hhmm%.*}"
  ss="${stamp##*.}"
  printf '%s.%s.%s' "$day" "$((10#$hhmm))" "$((10#$ss))"
}

check_env
check_tools
BUILD_NUMBER="${IOS_BUILD_NUMBER:-$(default_build_number)}"

# --- Plan ----------------------------------------------------------------------------------------------------------

print_plan() {
  local step=1
  log "iOS release plan: command=$COMMAND$([ "$UNSIGNED" -eq 1 ] && printf ' (unsigned compile check)')"
  printf '  Environment (values never shown):\n'
  env_status
  printf '  Output directory: %s\n' "${BUILD_DIR#"$REPO_ROOT"/}"
  if [ "$DO_BUILD" -eq 1 ]; then
    printf '  Build number (CFBundleVersion): %s\n' "$BUILD_NUMBER"
    if [ "$SKIP_PREBUILD" -eq 0 ]; then
      printf '  %d. expo prebuild --platform ios --clean (generates the ignored apps/mobile/ios, runs pod install)\n' "$step"
      step=$((step + 1))
    fi
    if [ "$UNSIGNED" -eq 1 ]; then
      printf '  %d. xcodebuild archive -configuration Release -destination generic/platform=iOS CODE_SIGNING_ALLOWED=NO\n' "$step"
      step=$((step + 1))
    else
      printf '  %d. xcodebuild archive -configuration Release -destination generic/platform=iOS -allowProvisioningUpdates (API key auth)\n' "$step"
      step=$((step + 1))
      printf '  %d. write ExportOptions.plist (method app-store-connect, automatic signing)\n' "$step"
      step=$((step + 1))
      printf '  %d. xcodebuild -exportArchive -allowProvisioningUpdates (API key auth) -> IPA\n' "$step"
      step=$((step + 1))
    fi
  fi
  if [ "$DO_UPLOAD" -eq 1 ]; then
    printf '  %d. xcrun altool --upload-app -t ios (API key auth via a temporary API_PRIVATE_KEYS_DIR) -> TestFlight\n' "$step"
  fi
}

print_plan
if [ "${#PROBLEMS[@]}" -gt 0 ]; then
  printf 'error: cannot continue:\n' >&2
  printf '  - %s\n' "${PROBLEMS[@]}" >&2
  exit 1
fi
if [ "$DRY_RUN" -eq 1 ]; then
  log "Dry run: nothing was executed."
  exit 0
fi

# --- Steps ---------------------------------------------------------------------------------------------------------

AUTH_ARGS=()
if [ -n "${ASC_KEY_ID:-}" ]; then
  AUTH_ARGS=(-allowProvisioningUpdates -authenticationKeyPath "$ASC_KEY_PATH" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
fi

# Runs xcodebuild with output in a gitignored log file; shows only the tail on failure.
run_xcodebuild() {
  local name="$1"
  shift
  local logfile="$LOG_DIR/$name.log"
  log "xcodebuild $name (log: ${logfile#"$REPO_ROOT"/})"
  if ! xcodebuild "$@" >"$logfile" 2>&1; then
    grep -E 'error:|\*\* .* FAILED \*\*' "$logfile" | tail -n 40 >&2 || true
    die "xcodebuild $name failed; see the log above"
  fi
  grep -E '\*\* .* SUCCEEDED \*\*' "$logfile" || true
}

build() {
  mkdir -p "$BUILD_DIR" "$LOG_DIR"
  export IOS_BUILD_NUMBER="$BUILD_NUMBER"
  if [ "$SKIP_PREBUILD" -eq 0 ]; then
    log "expo prebuild --platform ios --clean"
    (cd "$APP_DIR" && CI=1 EXPO_NO_TELEMETRY=1 pnpm exec expo prebuild --platform ios --clean)
  fi
  local workspace scheme
  workspace="$(find "$APP_DIR/ios" -maxdepth 1 -name '*.xcworkspace' | head -n 1)"
  [ -n "$workspace" ] || die "no .xcworkspace in apps/mobile/ios; run without --skip-prebuild"
  scheme="$(basename "$workspace" .xcworkspace)"
  rm -rf "$ARCHIVE_PATH"

  local archive_args=(archive -workspace "$workspace" -scheme "$scheme" -configuration Release
    -destination "generic/platform=iOS" -archivePath "$ARCHIVE_PATH")
  if [ "$UNSIGNED" -eq 1 ]; then
    run_xcodebuild archive "${archive_args[@]}" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""
    log "Unsigned Release archive: ${ARCHIVE_PATH#"$REPO_ROOT"/} (compile check only; it cannot be uploaded)"
    return
  fi
  run_xcodebuild archive "${archive_args[@]}" "${AUTH_ARGS[@]}"

  local options="$BUILD_DIR/ExportOptions.plist"
  cat >"$options" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>export</string>
  <key>signingStyle</key><string>automatic</string>
  <key>teamID</key><string>${APPLE_TEAM_ID}</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
PLIST
  rm -rf "$EXPORT_DIR"
  run_xcodebuild export -exportArchive -archivePath "$ARCHIVE_PATH" -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$options" "${AUTH_ARGS[@]}"
  log "IPA exported to ${EXPORT_DIR#"$REPO_ROOT"/}"
}

upload() {
  local ipa="$IPA_PATH"
  if [ -z "$ipa" ]; then
    ipa="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' 2>/dev/null | head -n 1)"
  fi
  [ -n "$ipa" ] && [ -f "$ipa" ] || die "no IPA found; run 'build' first or pass --ipa <path>"
  # altool looks the key up by file name (AuthKey_<id>.p8) in $API_PRIVATE_KEYS_DIR: link it from a private
  # temporary directory (KEYS_DIR, removed below and by the EXIT trap), so the key is never copied.
  local tmp_root="${TMPDIR:-/tmp}"
  KEYS_DIR="$(mktemp -d "${tmp_root%/}/budget-lens-asc-keys.XXXXXX")"
  chmod 700 "$KEYS_DIR"
  ln -s "$ASC_KEY_PATH" "$KEYS_DIR/AuthKey_${ASC_KEY_ID}.p8"
  log "Uploading $(basename "$ipa") to App Store Connect (TestFlight)"
  local status=0
  API_PRIVATE_KEYS_DIR="$KEYS_DIR" xcrun altool --upload-app -f "$ipa" -t ios \
    --api-key "$ASC_KEY_ID" --api-issuer "$ASC_ISSUER_ID" || status=$?
  cleanup
  if [ "$status" -ne 0 ]; then
    printf 'error: upload failed (altool exit code %s)\n' "$status" >&2
    exit "$status"
  fi
  log "Upload finished; the build appears in TestFlight after App Store Connect processing."
}

if [ "$DO_BUILD" -eq 1 ]; then
  build
fi
if [ "$DO_UPLOAD" -eq 1 ]; then
  upload
fi
