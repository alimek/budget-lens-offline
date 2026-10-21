# #75 encrypted boot evidence

Verification of the SQLCipher open sequence, the device key, the cipher guard, the boot and recovery screens and the
encrypted pre-migration copy. The tests used a Metro development server on port 8073 from this worktree, with
telemetry disabled
and the shared device lock held throughout. The suites ran sequentially. Targets were the dedicated
simulator/emulator selected by `E2E_IOS_SIMULATOR` and `E2E_ANDROID_AVD`, with Metro forwarded to the emulator only.

Tested commit: `40da9d3c4e76138b55bfafb114ca65a673529564`. Both reports record `run.vcs.dirty: false`. The
evidence-only commit below updates this README and adds the raw, unmodified screenshots; it changes no app code.
`expo-sqlite` is built with `useSQLCipher: true`, which is a native change, so both development clients were built
from this branch; nothing after that commit touches native code or the app configuration, and the JavaScript under
test comes from Metro.

| Platform | Command (telemetry disabled) | Run ID | Result |
| --- | --- | --- | --- |
| iOS | `pnpm e2e:ios --output .e2e/ios-final` | `01a15eaa-b28c-7feb-a2d2-8f83419b44ff` | 29 passed, 4 skipped, 0 failed |
| Android | `pnpm e2e:android --output .e2e/android-final6` | `01a15eb4-4ee0-7a13-a688-b7853e7b8734` | 29 passed, 1 failed, 4 skipped |

The four skipped tests require a separate 200% text-size run (`E2E_LARGE_TEXT=1`). Android has one additional
platform-specific list test. Six new tests in `apps/mobile/e2e/encrypted-boot.e2e.ts` run on both platforms:

- `starts up to Overview on the encrypted database` — a cold start that reaches Overview, which is only possible
  once the cipher guard, the device key and the migrations have all passed. On iOS the app was reinstalled first
  (uninstall keeps the Keychain item, so this is also the "new database with a leftover key" case from #34); on
  Android the emulator was rebooted and the existing database opened again.
- `reports an encrypted database and an encrypted pre-migration copy` — the development-only `/dev/storage-check`
  route reads `PRAGMA cipher_version` and `PRAGMA cipher_status`, looks at the first bytes of the database file, and
  takes and discards a real pre-migration copy. Both captures report `Cipher: 4.17.0 community`, `Keyed: 1`,
  `Database: encrypted` and `Pre-migration copy: encrypted`, so the copy written through `ATTACH … KEY` and
  `sqlcipher_export` really is ciphertext — the one thing unit tests on sql.js cannot show.
- four boot-screen tests, one per state: recovery (key missing), migration-failed, encryption-unavailable and
  storage-unreachable. They open development-only deep links (`budget-lens:///dev/boot-screen?screen=…`); those
  routes render nothing in a release build.

The one Android failure is the pre-existing list baseline `keeps the open Android row background unchanged` from
#195: 73 pixels (0.064%) of glyph anti-aliasing differ at `threshold: 0, maxDiffPixels: 0`. Neither the test nor the
screen it captures is touched by #75, and the same diff appeared in every Android run on this machine, including
runs of the preceding commits.

The first Android captures of this round showed the wall clock instead of the 9:41 demo clock, so demo mode was
reset on the dedicated emulator once, as [evidence/15](../15/README.md) documents; the captures below show 9:41.

## Screens

Both platforms, one capture per screen. These are byte-identical copies of the run artifacts under
`results/<test>/attempt-1/screenshots/`; no montage, cropping or other image processing was applied.

- [iOS Overview after an encrypted cold start](ios-boot-overview.png), [Android](android-boot-overview.png)
- [iOS storage check](ios-storage-check.png), [Android](android-storage-check.png)
- [iOS recovery screen](ios-boot-screen-recovery.png), [Android recovery](android-boot-screen-recovery.png)
- [iOS migration-failed screen](ios-boot-screen-migration-failed.png),
  [Android](android-boot-screen-migration-failed.png)
- [iOS encryption-unavailable screen](ios-boot-screen-encryption-unavailable.png),
  [Android](android-boot-screen-encryption-unavailable.png)
- [iOS storage-unreachable screen](ios-boot-screen-storage-unreachable.png),
  [Android](android-boot-screen-storage-unreachable.png)

| Capture | SHA-256 (matches the source artifact) |
| --- | --- |
| `ios-boot-overview.png` | `d017a0fdd8383c4bebde76a32a9ce5adc63b73849f3ae6622655d62e80e5c240` |
| `ios-storage-check.png` | `cd94e7d74f5414620f66b0b5a2b3b0f973e1fcc422a6bbf8f55a00b8f533e53b` |
| `ios-boot-screen-recovery.png` | `4213714024c45e2739e66e317809b9041b152121e1cc4c7eff67c78a3f33f337` |
| `ios-boot-screen-migration-failed.png` | `0d8b3b29f0feca2df6870335d82a9275c371ecda8b1029e66132ebe2a0f46c6c` |
| `ios-boot-screen-encryption-unavailable.png` | `7ac3ac033f64e5f3c691b48ad6a630bc991fdad27c106a7c09f7fff99ec0decd` |
| `ios-boot-screen-storage-unreachable.png` | `828cda5a6f9a1240ac631173592acba44288e3bad3cbb856da9142d070ed1f82` |
| `android-boot-overview.png` | `3f52afca409399998168c29512fd2ee887e2e6f0874d5609e3feaea07780fafc` |
| `android-storage-check.png` | `f13f04b6b08d98d63a04a58afbc7d7240ded71a6416b5794e5c1b2604a6cb8a6` |
| `android-boot-screen-recovery.png` | `2c4c42ab85d06ab03fd11938d379b1755b7abd1721766e81929e106449d466a8` |
| `android-boot-screen-migration-failed.png` | `eea817cdf1948b0bdfd1ce0056c6594fb498e5f92d31c81da0e76c06ce6d3a7f` |
| `android-boot-screen-encryption-unavailable.png` | `94cf3e9fc6186e52da2ae797126b7d70cf05de39d99d7e45b707c62f16b300e2` |
| `android-boot-screen-storage-unreachable.png` | `e77d353168562d6fc4de91cf85a3d1ac65e2836f763ffa8dadd9053ffab142b5` |
