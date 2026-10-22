## Summary

<!-- What changes and why. Mention the owner decision or issue it follows. -->

## Testing

<!-- What you ran locally (pnpm check, unit tests, local native build / e2e on your dev machine). -->

- [ ] UI change: e2e result summary and 1–3 key iOS screenshots attached below
- [ ] Platform-specific change (see docs/testing.md#platforms) or pre-release: e2e evidence on iOS and Android

## Screenshots

<!--
Required for every PR that changes UI; delete this section for non-UI PRs.
UI PRs include e2e evidence: the e2e result summary and 1-3 key screenshots that show the change (dedicated
simulator/emulator named (E2E_IOS_SIMULATOR / E2E_ANDROID_AVD, default BudgetLens-*)) from a TesterArmy `e2e` run or
`e2e explore` on a local development build on a local dev machine, attached to this PR description.
A manual screenshot from a development build alone is not enough.
Never commit test evidence (screenshots, e2e logs, run reports); keep the full run output locally, outside the repo
(#241, docs/testing.md#test-evidence-stays-out-of-the-repo).
Attach: name files <pr>-<n>.png (e.g. 241-1.png), run `gh release upload e2e-evidence <pr>-<n>.png --clobber` and embed
![...](https://github.com/alimek/budget-lens-offline/releases/download/e2e-evidence/<pr>-<n>.png) below.
Screenshots show no private setup details or personal data (no device names/serials, account names, paths,
notifications).
Platforms (docs/testing.md#platforms): iOS only by default. Add Android only when the PR touches native modules or
native deps, app config or config plugins, Platform.OS branches, .ios/.android files (including
apps/mobile/src/ui/native/*.ios.tsx / *.android.tsx), permissions, or fonts/assets that render per platform, and before
a release build. Otherwise delete the Android row.
Native builds and E2E do not run in CI (docs/ci.md#native-builds-and-e2e-local).
Never include secrets or personal data in screenshots.
-->

e2e command / flow run and result: <!-- e.g. `e2e run --target ios`, `e2e run --target android` or `e2e explore`, the flow covered, passed/failed -->

| Platform | Simulator / emulator | Key screenshots (1-3) |
| --- | --- | --- |
| iOS | `BudgetLens-iOS` or your E2E_IOS_SIMULATOR | |
| Android (platform-specific changes only) | `BudgetLens-Android` or your E2E_ANDROID_AVD | |

<!-- Link the issue; pr-body requires one of: Closes #N, Fixes #N, Resolves #N. -->
Closes #
