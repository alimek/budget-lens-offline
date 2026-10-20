# #74 database bootstrap evidence

Full-suite verification after restoring the `(currency, source)` exchange-rate key and correcting the database
failure documentation. The tests used a fresh Metro on port 8073 from this worktree, with telemetry disabled and
the shared device lock held throughout. The suites ran sequentially; Metro was stopped and the lock released
afterwards. Targets were the dedicated simulator/emulator selected by `E2E_IOS_SIMULATOR` and `E2E_ANDROID_AVD`.

Tested commit: `8d5739bbd315b0fc84215ade04e214098dcf17e4`. Both reports record `run.vcs.dirty: false`.
The following evidence-only commit updates this README and the raw, unmodified e2e screenshots; it changes no
app code. Native dependencies and config are unchanged from the previously rebuilt clients, so no new native
build was needed for this verification.

| Platform | Command (telemetry disabled) | Run ID | Result |
| --- | --- | --- | --- |
| iOS | `pnpm e2e:ios --output .e2e/ios-review` | `01a15b46-f64d-760c-9a43-81a35fd9fb6c` | 23 passed, 4 skipped, 0 failed |
| Android | `pnpm e2e:android --output .e2e/android-review` | `01a15b4d-b314-7ed4-a82d-7a5f9a09832b` | 24 passed, 4 skipped, 0 failed |

The four skipped tests require a separate 200% text-size run (`E2E_LARGE_TEXT=1`); the full default suite was
selected on each platform. Android has one additional platform-specific list test. Both suites include launch
to Overview and navigation through all tabs and Savings. No reruns were needed on the fixed commit.

The captures below are byte-identical copies of these runs' `opens Overview as the home screen` screenshots.
Android uses the 9:41 demo clock. Its new source capture matches the previous PNG byte for byte because the
screen and clock are unchanged; it was copied again from the new run and verified against that artifact. No
montage, cropping or other image processing was applied.

- [iOS Overview](ios-overview.png)
- [Android Overview](android-overview.png)

| Capture | SHA-256 (matches the source artifact) |
| --- | --- |
| `ios-overview.png` | `72c528ae2c3e4baf68d29e875b8953f6b4dc869547b733aa30790b878137c876` |
| `android-overview.png` | `3dad343c7c3742448a20a28d64bf05881949c46538eb0c043b50c4c820990723` |

`pnpm check` passed: 401 core tests, 12 database tests and 60 mobile tests; migration checks, typecheck, lint
and Fallow passed. Database tests cover empty migration, idempotence, preservation of both rate sources across
an upgrade, rollback on a failed migration, preserved child rows and business-rule constraints.

#74's acceptance criteria cover startup migrations and Drizzle consistency. The database gate throws bootstrap
failures during render and prevents data screens from mounting; no app-defined root boundary or failure/retry UI
is implemented here. A root boundary and recovery screens remain follow-up work in #60/#75. SQLCipher key setup,
encrypted pre-migration copies and the cipher guard remain #75.
