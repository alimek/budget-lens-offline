# #75 encrypted boot evidence

Verification of the SQLCipher open sequence, the device key, the cipher guard, the boot and recovery screens and the
encrypted pre-migration copy. The tests used a Metro development server on port 8073 from this worktree, with
telemetry disabled and the shared device lock held throughout. The suites ran sequentially. Targets were the dedicated
simulator/emulator selected by `E2E_IOS_SIMULATOR` and `E2E_ANDROID_AVD`, with Metro forwarded to the emulator only.

Tested commit: `ff80a3a43e854fd8e9e606edfead90ce33a9a7f8`. Both reports record `run.vcs.dirty: false`. The
evidence-only commit below updates this README and adds the raw, unmodified screenshots; it changes no app code.
`expo-sqlite` is built with `useSQLCipher: true`, which is a native change, so both development clients were built
from this branch; nothing after that commit touches native code or the app configuration, and the JavaScript under
test comes from Metro.

| Platform | Command (telemetry disabled, dedicated device selected by env) | Run ID | Result |
| --- | --- | --- | --- |
| iOS | `e2e run --target ios --output .e2e/ios-r3` | `01a15f08-ef34-7efb-86ed-cb4f660df1b8` | 32 passed, 4 skipped, 0 failed |
| Android | `e2e run --target android --output .e2e/android-r3` | `01a15f11-17d7-752f-a7af-94744e409026` | 33 passed, 4 skipped, 0 failed |

The four skipped tests require a separate 200% text-size run (`E2E_LARGE_TEXT=1`). Android has one additional
platform-specific list test. Nine tests in `apps/mobile/e2e/encrypted-boot.e2e.ts` run on both platforms:

- `starts up to Overview on the encrypted database` — a cold start that reaches Overview, which is only possible
  once the cipher guard, the device key and the migrations have all passed. On both platforms this launch reopened an
  existing encrypted database after the device had been restarted.
- `reports an encrypted database and an encrypted pre-migration copy` — the development-only `/dev/storage-check`
  route reads `PRAGMA cipher_version` and `PRAGMA cipher_status`, looks at the first bytes of the database file, and
  takes and discards a real pre-migration copy. Both captures report `Cipher: 4.17.0 community`, `Keyed: 1`,
  `Database: encrypted` and `Pre-migration copy: encrypted`, so the copy written through `ATTACH … KEY` and
  `sqlcipher_export` really is ciphertext — the one thing unit tests on sql.js cannot show.
- five boot-screen tests, one per state: recovery (key missing), migration-failed, restore-failed,
  state-unrecognized and storage-unreachable, plus the encryption-unavailable hard stop. The recovery screen offers
  both actions and the weight follows the reason: Try again is primary after a failed migration or restore, Start
  over is primary where the key is gone. They open development-only deep links
  (`budget-lens:///dev/boot-screen?screen=…`); those routes render nothing in a release build.
- `recovers from a real unreadable database and keeps its file` — the acceptance criterion of #75 on a device, over a
  real file rather than a rendered mock: the development-only `/dev/forget-key` route forgets the stored key of the
  encrypted database on this device, a cold start then reaches the recovery screen, and "Start over" keeps the file.
  The storage check afterwards lists `budget-lens.orphan-<stamp>.db` as still encrypted beside the fresh encrypted
  database, so the budget that could not be opened is still on the device as ciphertext and its key moved with it.

The Android baseline capture `keeps the open Android row background unchanged` from #195 differs by 73 pixels
(0.064%) on any development client rebuilt with SQLCipher, at the `maxDiffPixels: 0` it was committed with: 925
differing pixels, maximum channel delta 5/255, all inside the glyph rows of the amount text — anti-aliasing, not the
row background. Neither the test nor the screen it captures is touched by #75; it appeared once this branch's
development client was rebuilt with SQLCipher and the three new native modules. The reviewed baseline is kept and a
tolerance of 150 pixels is set on that one capture only, so the #195 artifact stays the reviewed image.

Android captures show the 9:41 demo clock. agent-device stabilizes each Android screenshot with the SystemUI demo
`clock` command; when a capture on this emulator shows another time, demo mode is reset once as documented in
[evidence/15](../15/README.md).

## Screens

Both platforms, one capture per screen. These are byte-identical copies of the run artifacts under
`results/<test>/attempt-1/screenshots/`; no montage, cropping or other image processing was applied.

- [iOS Overview after an encrypted cold start](ios-boot-overview.png), [Android](android-boot-overview.png)
- [iOS storage check](ios-storage-check.png), [Android](android-storage-check.png)
- [iOS recovery screen](ios-boot-screen-recovery.png), [Android recovery](android-boot-screen-recovery.png)
- [iOS migration-failed screen](ios-boot-screen-migration-failed.png),
  [Android](android-boot-screen-migration-failed.png)
- [iOS restore-failed screen](ios-boot-screen-restore-failed.png),
  [Android](android-boot-screen-restore-failed.png)
- [iOS unrecognised-state screen](ios-boot-screen-state-unrecognized.png),
  [Android](android-boot-screen-state-unrecognized.png)
- [iOS encryption-unavailable screen](ios-boot-screen-encryption-unavailable.png),
  [Android](android-boot-screen-encryption-unavailable.png)
- [iOS storage-unreachable screen](ios-boot-screen-storage-unreachable.png),
  [Android](android-boot-screen-storage-unreachable.png)
- [iOS recovery over a real unreadable database](ios-recovery-unreadable-database.png),
  [Android](android-recovery-unreadable-database.png)
- [iOS kept file after Start over](ios-storage-check-kept-file.png),
  [Android](android-storage-check-kept-file.png)
| Capture | SHA-256 (matches the source artifact) |
| --- | --- |
| `ios-boot-overview.png` | `26c44ed3bcd40bced984434f0db5cc030ac9e0f5b3b4dac9ce371bbc170d4639` |
| `ios-boot-screen-encryption-unavailable.png` | `81d6f1f42704e538fc0b24bf34d0f537793ae9d771d68fd0bdc2883c76a30baf` |
| `ios-boot-screen-migration-failed.png` | `35d345a530bd2979f07f14361e86458d211f7796ac011dde92c71dc555919554` |
| `ios-boot-screen-recovery.png` | `da2ed62804d81d4e0d50ff9f1df166d1c118d659795e285abecda17ec97af908` |
| `ios-boot-screen-restore-failed.png` | `dddcafb73b2c0eb4b4230c809a031f93664b98ea5d8944a51c87424edb2b3dd6` |
| `ios-boot-screen-state-unrecognized.png` | `a336423c524e481caa88b3dc0d714142d433f4ac629b33520ce2580111e24885` |
| `ios-boot-screen-storage-unreachable.png` | `17de5cebd784ba1d7b8dac7bc76adf92dd50123d42dc8c04951705bc60485240` |
| `ios-recovery-unreadable-database.png` | `77ab552c18ecfecf49d5fad596ea336c85f8a55ebfb8b35a39348dc7261e67bd` |
| `ios-storage-check-kept-file.png` | `debd02c35a95ef60d3310b880a0ca50cb2421fbb30aabbf46ce9d573d9c8bd21` |
| `ios-storage-check.png` | `3dab667fd32f06e3bf805d7e11a9534b35acd1a1738893ee33e3cb38650655b1` |
| `android-boot-overview.png` | `3f52afca409399998168c29512fd2ee887e2e6f0874d5609e3feaea07780fafc` |
| `android-boot-screen-encryption-unavailable.png` | `94cf3e9fc6186e52da2ae797126b7d70cf05de39d99d7e45b707c62f16b300e2` |
| `android-boot-screen-migration-failed.png` | `89368ea5aff6990b8d9704e0b84a9083f9edc254df3927c2b22775c7a4f65b3c` |
| `android-boot-screen-recovery.png` | `cbc078ba896046115c26b065a7d9d381a9382ffe93b3cc6506b0a27aa120e08e` |
| `android-boot-screen-restore-failed.png` | `2e459d72a506e0ca44996cea6f8c8b9622a922b200f90f4ac08545a7a121b90a` |
| `android-boot-screen-state-unrecognized.png` | `4b05d5b9ecfe2702da34dc693e846252a17cc1b9f95f27bd810946db66fe4884` |
| `android-boot-screen-storage-unreachable.png` | `e77d353168562d6fc4de91cf85a3d1ac65e2836f763ffa8dadd9053ffab142b5` |
| `android-recovery-unreadable-database.png` | `1a51a0b5a9d4cf6b1a92d86113619ad17aca84c29be05cb48e2e15815c66e839` |
| `android-storage-check-kept-file.png` | `e980ffbf27e1cfd83688041d1d47767f46644c975f2a5b3e30b6fceeb866ec3e` |
| `android-storage-check.png` | `ca81aacb65973c43c2d0d45f1a0570b8a2327a50eadf5228410e39a863c67af4` |
