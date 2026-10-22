# Owner decisions log

One log of the owner's answers given in issue/PR comments or chat. **Newest first.** Times are Europe/Warsaw (UTC+2
in summer, UTC+1 in winter). Only verbatim owner answers count as confirmation; owner input that is not yet a decision
is marked as input. Stack decisions with a longer rationale live in the [ADRs](decisions/README.md). Add new entries at the top.

## 2026-10-22 23:33 (Europe/Warsaw): no migration from the encrypted database; those installs start empty

- **Question:** whether an install that already has an encrypted database gets a migration path when the encryption
  is removed (asked 2026-10-22 23:33).
- **Answer:** option A: no migration (confirmed directly by the owner in chat, 2026-10-22 23:33)
- **Meaning:** an install updating from a build of #75 cannot open its own file, because the key it needs is no
  longer stored, and rewriting the file would mean keeping exactly the key handling #242 removes. Such an install
  therefore gets the single recovery screen; accepting "Start over" renames its encrypted file aside and continues
  with an **empty budget**. **The budget that was on that device is lost**: the file stays on disk for support and
  for E8, but this build cannot read it, and there is no restore path until E8 ([#97](https://github.com/alimek/budget-lens-offline/issues/97)).
  A fresh install is unaffected. Stated in
  [ADR 0007](decisions/0007-local-database.md), [architecture](architecture.md),
  [app-shell-storage](features/app-shell-storage.md) and [packages/db](../packages/db/README.md).
- **Issues:** [#242](https://github.com/alimek/budget-lens-offline/issues/242)

## 2026-10-22 23:26 (Europe/Warsaw): the database is plain SQLite; the recovery screens are simplified

- **Question:** "Usuwam szyfrowanie bazy (SQLCipher) i upraszczam ekrany awaryjne, dane trzymamy w zwykłym SQLite?"
  (owner's own chat, 2026-10-22 23:26)
- **Answer:** "Tak, usuń szyfrowanie" (confirmed directly by the owner in chat, 2026-10-22 23:26); to the follow-up
  question "Kiedy usuwamy szyfrowanie bazy?" — "Teraz, przed formularzem".
- **Original (another chat, relayed, 23:20):** question "Jak przechowujemy dane?", answer "A: zwykły SQLite bez
  własnego szyfrowania, uprościć ekrany awaryjne".
- **Meaning:** the data lives in a plain expo-sqlite database: no SQLCipher (`useSQLCipher`), no database key in
  secure storage, no cipher checks, no key pairing or orphan keys, and no app-level encryption at all; privacy rests
  on the app sandbox and the OS's own data protection. The pre-migration copy stays. There is exactly one recovery
  screen, shown when the database cannot be opened or migrated, with "Try again" and "Start over" behind a
  confirmation; the other boot and recovery states, their copy and their tests are gone. Android Auto Backup still
  excludes the database. This is a native change: a new local build, nothing published. It supersedes the SQLCipher
  part of [ADR 0007](decisions/0007-local-database.md); expo-sqlite + Drizzle stand
  ([architecture](architecture.md), [app-shell-storage](features/app-shell-storage.md)).
- **Issues:** [#242](https://github.com/alimek/budget-lens-offline/issues/242)

## 2026-10-22 23:18 (Europe/Warsaw): test evidence leaves the repo; PRs carry only key screenshots

- **Question:** asked to confirm logging that test evidence leaves the repo and PRs carry only key screenshots
  (owner's own chat, 2026-10-22 23:19).
- **Answer:** "Tak, wpisz" (confirmed directly by the owner in chat, 2026-10-22 23:19)
- **Original (another chat, relayed, 23:18):** "w repozytorium to nie jest miejsce na trzymanie screenshotów z
  ewidencji testów, I w ogóle, jeżeli mamy coś jeszcze, co jest ewidencją testów, to powinniśmy to wywalić z
  repozytorium" and "Jak już coś, to do piarki powinniśmy uploadować"; only specific screenshots that show the change.
- **Meaning:** test evidence (screenshots, e2e logs, run reports) is not committed; `docs/evidence/` is removed (Git
  history stays as is). Run e2e locally and keep the full run output locally, outside the repo. A UI PR description
  carries the e2e result summary and at most 1–3 key screenshots that show the change (iOS by default, #238),
  attached to the PR description: uploaded as `<pr>-<n>.png` to the `e2e-evidence` pre-release and embedded by the
  asset's download URL, with no private setup details or personal data in the images
  ([testing.md](testing.md#test-evidence-stays-out-of-the-repo)).
- **Issues:** [#241](https://github.com/alimek/budget-lens-offline/issues/241)

## 2026-10-22 22:47 (Europe/Warsaw): at most one simulator task in progress at a time

- **Question:** asked to confirm recording the owner's words below as a decision (owner's own chat, 2026-10-22 22:53).
- **Answer:** "Tak, wpisz" (confirmed directly by the owner in chat, 2026-10-22 22:53)
- **Original (another chat, relayed, 22:47):** "nie powinniśmy nigdy mieć dwóch tasków na raz działających,
  próbujących coś testować na UI-u"
- **Context:** there is only one simulator.
- **Meaning:** at most one issue or PR labeled `needs:simulator` is in progress at a time. Mixed work is split into a
  UI part (needs the simulator, label `needs:simulator`) and a non-UI part (core, db, logic: unit tests only) that may
  run in parallel ([testing.md](testing.md#one-simulator)).
- **Issues:** [#238](https://github.com/alimek/budget-lens-offline/issues/238)

## 2026-10-22 22:45 (Europe/Warsaw): six components move to universal Expo UI after the current stage

- **Question:** asked to confirm logging the decision that the six components move to universal Expo UI
  ([#237](https://github.com/alimek/budget-lens-offline/issues/237)), but only after the current stage (owner's own
  chat, 2026-10-22 22:48).
- **Answer:** "Tak, potwierdzam" (confirmed directly by the owner in chat, 2026-10-22 22:48)
- **Original (another chat, relayed, 22:45):** question "Przenieść sześć komponentów na uniwersalne Expo UI?", answer
  "A: tak, przenieś sześć komponentów na universal po obecnym etapie".
- **Meaning:** the six components move to universal Expo UI, but only after the current stage (E3); until then the
  per-platform wrappers stay as they are.
- **Issues:** [#237](https://github.com/alimek/budget-lens-offline/issues/237)

## 2026-10-22 22:41 (Europe/Warsaw): UI changes are tested on iOS by default

- **Question:** "Na co dzień testuję tylko na iOS, a Androida tylko przy zmianach zależnych od platformy i przed
  buildem?" (owner's own chat, 2026-10-22 22:46)
- **Answer:** "Tak, tak zrób" (confirmed directly by the owner in chat, 2026-10-22 22:46)
- **Original (another chat, relayed, 22:41):** question "Na której platformie testujemy na co dzień?", answer "iOS na
  co dzień".
- **Context:** testing on two devices every time takes too long unless something is platform-specific.
- **Meaning:** UI PRs carry local e2e evidence on iOS only (where it lives is superseded by
  [#241](https://github.com/alimek/budget-lens-offline/issues/241)). Both iOS and Android are tested only for platform-specific
  changes (native modules or deps, app config or config plugins, `Platform.OS` branches, `.ios` / `.android` files
  including the Expo UI wrappers in `apps/mobile/src/ui/native/`, permissions, fonts or assets that render per
  platform) and before a release build. Screens that only use the wrappers are iOS-only
  ([testing.md](testing.md#platforms)).
- **Issues:** [#238](https://github.com/alimek/budget-lens-offline/issues/238)

## 2026-10-22 22:09 (Europe/Warsaw): the machine-agnostic check script is removed

- **Question:** "Mam zamknąć zmianę z przeniesieniem nazw i otworzyć nową, która całkiem usuwa ten skrypt z repo i z
  CI?"
- **Answer:** "Tak, usuń skrypt całkiem" (owner answer in chat, 2026-10-22 22:09)
- **Context:** earlier in the same chat (22:06) the owner wrote: "moimzdaniem do wywalnie".
- **Meaning:** `scripts/check-machine-agnostic.mjs` and its call from `pnpm lint` (and so CI) are removed; the
  machine-agnostic rule (#171) stays in [AGENTS.md](../AGENTS.md) and is enforced in review. Supersedes
  [PR #235](https://github.com/alimek/budget-lens-offline/pull/235).
- **Issues:** [#234](https://github.com/alimek/budget-lens-offline/issues/234), [PR #236](https://github.com/alimek/budget-lens-offline/pull/236), [#171](https://github.com/alimek/budget-lens-offline/issues/171)

## 2026-10-22 21:20 (Europe/Warsaw): #11, #12 and #13 move to the roadmap

- **Question:** "Zamknąć te trzy zadania i przenieść je do roadmapy?"
- **Answer:** "Tak, zamknij i przenieś" (owner answer in chat, 2026-10-22 21:20)
- **Meaning:** target group research (#11), the one-time license pricing model (#12) and the website on the existing
  domain (#13) are deferred to later stages; the issues are closed and tracked in [docs/roadmap.md](roadmap.md).
- **Issues:** [#11](https://github.com/alimek/budget-lens-offline/issues/11), [#12](https://github.com/alimek/budget-lens-offline/issues/12), [#13](https://github.com/alimek/budget-lens-offline/issues/13), [docs/roadmap.md](roadmap.md)

## 2026-10-22 20:38 (Europe/Warsaw): end-of-month figure includes savings

- **Question:** "Kwota „Zostanie na koniec miesiąca” = suma kont prywatnych + wpływy, które jeszcze przyjdą − koszty,
  które trzeba jeszcze zapłacić; oszczędności pod spodem osobną linią „razem z oszczędnościami”. Tak ma to wyglądać?"
- **Answer:** "Nie, wlicz oszczędności w główną kwotę"
- **Meaning:** the main end-of-month figure = private accounts + income still to come − costs still to pay + savings.
  The balance itself still excludes savings.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6348428599)

## 2026-10-22 20:36 (Europe/Warsaw): MVP balance is a list of private accounts

- **Question:** "Na start wystarczy lista kont prywatnych z nazwą i aktualną kwotą, bez przypisywania wydatków do
  konkretnego konta?"
- **Answer:** "Tak, wystarczy"
- **Meaning:** for the MVP the balance is a list of private (spendable) accounts, each with a name and current
  amount; expenses are not assigned to accounts.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6348366311)

## 2026-10-22 20:29 (Europe/Warsaw): owner input, not a decision: balance means spendable private accounts

- **Question:** none recorded; this is the owner's input on the balance definition, given in chat.
- **Answer (owner input, not a final decision):**
  > No to ja bym to troszkę inaczej zrobił, bo w aplikacji, której teraz mam, to mam definicję salda jako jakby ilość
  > dostępnych moich pieniędzy, ale to niech się nie tyczy apropo wszystkich oszczędności czy konc i tak dalej, tylko
  > to są takie pieniądze na koncie, które są do wydania po prostu.
  > Oczywiście możesz mieć wiele kąt, które są do wydania. Może być to jedno konto. To takie konto prywatne, tak bym
  > to nazwał, tak? Tych kąt może mieć wiele, no i może to jest moje saldo, tak?
  > I te saldo, plus wszystkie moje oszczędności, plus wszystkie moje koszty w miesiącu, dają mi jakieś nazwę to saldo
  > końcowe, tak? Jakie mi zostanie w tym miesiącu, ale to trzeba jakoś rozróżniać
- **Meaning:** "balance" is spendable money on one or more private accounts, without savings; a separate end-of-month
  figure combines it with savings and the month's costs. The source comment says this is "new input, not a final
  decision yet". Refined by the two entries above (20:36 and 20:38), which are the answers so far.
- **Status:** the E5 check-balance design ([#66](https://github.com/alimek/budget-lens-offline/issues/66)) is pending a
  new proposal.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6348235404), [#59](https://github.com/alimek/budget-lens-offline/issues/59), [#67](https://github.com/alimek/budget-lens-offline/issues/67)

## 2026-10-22 19:48 (Europe/Warsaw): chart library, minimum OS and bundle size

- **Question:** "chart-kit v7 with minSdk 26 (proposed), or a custom Skia 3 chart with minSdk 29?"
  ([#44 follow-up](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340082741))
- **Decision text (from the [#44 comment](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575), 2026-10-22 13:54):** "Owner decision (2026-10-22):
  react-native-chart-kit 7.0.4 (v2 charts) on react-native-svg 15.16.0 (SDK 58 pin). Minimum OS: Android 8.0
  (minSdk 26) and iOS 16.4. A 1-day spike validates the library before #89."
- **Answer:** "Tak, potwierdzam chart-kit, Android 8 / iOS 16.4 i +0,5 MB; merguj #226 po poprawce R1" (owner answer in
  chat, 2026-10-22 19:48)
- **Note:** follows the [Android 7 drop](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340036713) (13:50). About +0.5 MB of bundle per platform is accepted
  ([PR #226](https://github.com/alimek/budget-lens-offline/pull/226)); see [ADR 0014](decisions/0014-chart-library-and-minimum-os.md).
- **Issues:** [#44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575), [#218](https://github.com/alimek/budget-lens-offline/issues/218), [#89](https://github.com/alimek/budget-lens-offline/issues/89), [PR #226](https://github.com/alimek/budget-lens-offline/pull/226)

## 2026-10-22 15:07 (Europe/Warsaw): #66 answers to questions 1–3 accepted

- **Question:** the recommended answers to questions 1–3 on
  [#66](https://github.com/alimek/budget-lens-offline/issues/66) (E5 month closing).
- **Answer:** "Tak, akceptuję odpowiedzi 1–3 z #66, merguj #225" (owner answer in chat, 2026-10-22 15:07)
- **Meaning:** keep Check balance as check-only; later months are blocked only until the ended month is closed; the
  Remind me card shows only after the first close. The check-balance part is affected by the 20:29 owner input above.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6341377311), [PR #225](https://github.com/alimek/budget-lens-offline/pull/225)

## 2026-10-22 14:32 (Europe/Warsaw): #66 rules replace #43

- **Question:** "Obowiązują zasady z #66 zamiast #43?"
- **Answer:** "Tak, obowiązuje #66: zamknięcie dopiero po końcu miesiąca, saldo zawsze z danych bez szacunków, faktyczne
  saldo tylko do sprawdzenia" (owner answer in chat, 2026-10-22 14:32)
- **Meaning:** supersedes the 14:15 #43 defaults on early close, estimated catch-up balances and the closing balance
  source.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340848278), [#43](https://github.com/alimek/budget-lens-offline/issues/43)

## 2026-10-22 14:15 (Europe/Warsaw): #43 and #45 recommended defaults accepted

- **Question:** "Przyjmujemy domyślne propozycje z #43 i #45?" (research comments on
  [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6339987487) and
  [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340343141))
- **Answer:** "Tak, przyjmuję domyślne z #43 i #45" (owner answer in chat, 2026-10-22 14:15)
- **Recorded in the comments (same text on both):** "Owner decision (2026-10-22): all recommended defaults in the
  research comment above are accepted."
- **Note:** superseded for #43 at 14:32 by the entry above ("Obowiązują zasady z #66 zamiast #43?").
- **Issues:** [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501)

## 2026-10-22 13:54 (Europe/Warsaw): chart library and minimum OS

- **Question:** "Która opcja wykresów?"
- **Answer:** "chart-kit v7, Android 8+ i iOS 16.4" (owner answer in chat, 2026-10-22 13:54)
- **Note:** confirmed with the bundle size at 19:48 (entry above).
- **Issues:** [#44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575)
