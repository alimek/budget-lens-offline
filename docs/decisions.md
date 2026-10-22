# Owner decisions log

One log of the owner's answers given in issue/PR comments or chat. **Newest first.** Times are Europe/Warsaw (UTC+2
in summer, UTC+1 in winter). Only verbatim owner answers count as confirmation; owner input that is not yet a decision
is marked as input. Stack decisions with a longer rationale live in the [ADRs](decisions/README.md). Add new entries at the top.

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
