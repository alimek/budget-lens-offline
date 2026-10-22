# Owner decisions log

One log of the owner's answers given in issue and PR comments. **Newest first.** Times are Europe/Warsaw (UTC+2 in
summer, UTC+1 in winter). Answers are quoted as written in the linked comment; when the comment only records the
decision (not the owner's own words), the entry says so. Stack decisions with a longer rationale live in the
[ADRs](decisions/README.md). Add new entries at the top.

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

## 2026-10-22 20:29 (Europe/Warsaw): balance means spendable private accounts, not savings

- **Question:** none recorded; this is the owner's input on the balance definition, given in chat.
- **Answer:**
  > No to ja bym to troszkę inaczej zrobił, bo w aplikacji, której teraz mam, to mam definicję salda jako jakby ilość
  > dostępnych moich pieniędzy, ale to niech się nie tyczy apropo wszystkich oszczędności czy konc i tak dalej, tylko
  > to są takie pieniądze na koncie, które są do wydania po prostu.
  > Oczywiście możesz mieć wiele kąt, które są do wydania. Może być to jedno konto. To takie konto prywatne, tak bym
  > to nazwał, tak? Tych kąt może mieć wiele, no i może to jest moje saldo, tak?
  > I te saldo, plus wszystkie moje oszczędności, plus wszystkie moje koszty w miesiącu, dają mi jakieś nazwę to saldo
  > końcowe, tak? Jakie mi zostanie w tym miesiącu, ale to trzeba jakoś rozróżniać
- **Meaning:** "balance" is spendable money on one or more private accounts, without savings; a separate end-of-month
  figure combines it with savings and the month's costs. Refined by the two entries above.
- **Issues:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6348235404), [#59](https://github.com/alimek/budget-lens-offline/issues/59), [#67](https://github.com/alimek/budget-lens-offline/issues/67)

## 2026-10-22 14:15 (Europe/Warsaw): #43 and #45 recommended defaults accepted

- **Question:** the "Decisions needed" lists in the research comments on
  [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6339987487) (month lifecycle edge cases) and
  [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340343141) (warning semantics and local notifications).
- **Answer (recorded in the comments, same text on both):** "Owner decision (2026-10-22): all recommended defaults in
  the research comment above are accepted."
- **Note:** [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340848278) later superseded #43 on early close, estimated catch-up
  balances and the closing balance source.
- **Issues:** [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501)

## 2026-10-22 13:54 (Europe/Warsaw): chart library and minimum OS

- **Question:** "chart-kit v7 with minSdk 26 (proposed), or a custom Skia 3 chart with minSdk 29?"
  ([#44 follow-up](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340082741))
- **Answer (recorded in the comment):** "Owner decision (2026-10-22): react-native-chart-kit 7.0.4 (v2 charts) on
  react-native-svg 15.16.0 (SDK 58 pin). Minimum OS: Android 8.0 (minSdk 26) and iOS 16.4. A 1-day spike validates
  the library before #89."
- **Note:** follows the [Android 7 drop](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340036713) (13:50). The spike result and about
  +0.5 MB of bundle per platform were [confirmed on PR #226](https://github.com/alimek/budget-lens-offline/pull/226#issuecomment-6347422332) (19:49);
  see [ADR 0014](decisions/0014-chart-library-and-minimum-os.md).
- **Issues:** [#44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575), [#218](https://github.com/alimek/budget-lens-offline/issues/218), [#89](https://github.com/alimek/budget-lens-offline/issues/89)
