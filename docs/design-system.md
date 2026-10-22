# Design system (#119)

The component layer of `apps/mobile`: shared tokens and components, so every screen is built from the same
building blocks. Source of truth for the visual decisions: the approved
[#58 spec](https://github.com/alimek/budget-lens-offline/issues/58#issuecomment-6254174334) (direction C, Indigo).

Order of preference for every UI element: a native Expo UI control (`@expo/ui/swift-ui` on iOS,
`@expo/ui/jetpack-compose` on Android, Expo Router `NativeTabs`), then a React Native Reusables (RNR) component,
then a custom component.

## Tokens

- `apps/mobile/global.css`: the Indigo light/dark colours in Uniwind format (`@layer theme` → `:root` →
  `@variant light` / `@variant dark`) with shadcn/RNR names (`background`, `foreground`, `card`, `primary`,
  `primary-foreground`, `muted-foreground`, `destructive`, `border`, `input`, `ring`, …) plus `income` and `expense`,
  and the radii `sm` 6, `md` 8, `lg` 12 for custom elements. Use them as classes: `bg-background`, `bg-card`,
  `text-muted-foreground`, `text-income`, `rounded-lg`.
- `apps/mobile/src/ui/lib/theme.ts`: the same values as a typed object for native props that take colours (tab tint,
  Expo UI tints, navigation theme). `useThemeColors()` returns the set for the system appearance;
  `useDynamicColor(token)` returns a `DynamicColorIOS` on iOS.
- `src/ui/lib/theme.test.ts` fails when `global.css` and `theme.ts` drift apart (run by `pnpm test` in CI).
- No font tokens: the platform system font (SF Pro / Roboto) is used everywhere. Never set `fontFamily` or a
  `font-sans` / `font-mono` class.

## Typography

`Text` (`src/ui/components/text.tsx`, based on RNR `text`) takes a `variant` from the #58 type scale: `display`,
`title-1`, `title-2`, `title-3`, `headline`, `body` (default), `callout`, `subheadline`, `footnote`, `caption`,
`section-label`, `amount-lg`, `amount`. `typeStyle()` (`src/ui/typography.ts`) sets only size, line height and
weight per platform (iOS Dynamic Type sizes, Material 3 roles on Android); font scaling stays on. Headings get the
`heading` role.

`AmountText` formats integer minor units with `formatAmount()` (`src/ui/amount.ts`, on top of `formatMoney` from
`@budget-lens/core`): `Intl` per app language (`12 345,67 zł` in Polish, `PLN 12,345.67` in English), a real minus
`−` (U+2212) for negative amounts, `+` with `sign="always"`, the `income` / `expense` colour by sign (`colored={false}`
for totals), tabular figures and right alignment.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `Text`, `AmountText` | `src/ui/components` (RNR `text`) | see above |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | RNR `card` | `bg-card rounded-lg p-4` |
| `Badge` | RNR `badge` | default `tinted` (primary at 12%) for "Changed this month" |
| `Separator` | RNR `separator` | custom views only; native lists keep their own |
| `Screen` | `src/ui/components/screen.tsx` | scrollable screen root on `background`, `screen-<name>` test ID |
| `PrimaryButton`, `SecondaryButton` | `src/ui/native/button.*` | SwiftUI `borderedProminent` / `bordered`; M3 `Button` / `OutlinedButton` |
| `AppToggle` | `src/ui/native/toggle.*` | SwiftUI `Toggle(label:)`; M3 `Switch` in a toggleable row. The required `label` is the accessible name: VoiceOver and TalkBack read one switch with its label and on/off state (on Android a React Native `switch` wrapper carries the semantics and the Compose row is hidden from accessibility) |
| `SegmentedControl` | `src/ui/native/segmented-control.*` | SwiftUI segmented `Picker`; M3 `SegmentedButton` row |
| `BudgetProgress` | `src/ui/components/budget-progress.tsx` | label, bar and status text; `progressbar` role named by the label with `accessibilityValue` (0–100, status text). Over budget the bar and the status turn `expense` and the text says so (`budget.overBudget`), so it is never shown by colour alone (`budgetProgress()` in `src/ui/progress.ts`) |
| `ProgressIndicator` | `src/ui/native/progress-indicator.*` | SwiftUI `ProgressView`; M3 `LinearProgressIndicator`; decorative, used by `BudgetProgress`. `fraction` is optional: without it the indicator is indeterminate (a circular `ProgressView` on iOS, the M3 indeterminate track on Android), which is the loading state of #112 |
| `AppTextField` | `src/ui/native/text-field.*` | SwiftUI `TextField` / `SecureField` (rounded border) under a visible label; M3 `OutlinedTextField` with a floating label. `kind`: `text`, `decimal` (decimal keypad) or `secure`. The label is the accessible name (on iOS the visible label is hidden from VoiceOver and set on the field; on Android TalkBack reads the Compose label with the field). `error` shows below the field in `expense` (`<testID>-error`) and is the iOS hint / the M3 supporting text. The native field owns the text while typing (`useSyncedText`), so a late re-render never drops keystrokes. `validateAmountInput()` (`src/ui/amount-input.ts`) maps `parseMoney` errors to `amountInput.*` messages |
| `AppPicker` | `src/ui/native/picker.*` | SwiftUI menu `Picker` under a visible label (VoiceOver: label, value, pop-up button); M3 `ExposedDropdownMenuBox` with a read-only outlined field. Options get `<testID>-<value>` |
| `AppDatePicker` | `src/ui/native/date-picker.*` | Date only, on a `CalendarDate` (`YYYY-MM-DD`, `src/ui/calendar-date.ts`). SwiftUI compact `DatePicker` under a visible label; on Android a read-only outlined field (a button named by the label, value = formatted date) that opens the M3 `DatePickerDialog` (`common.ok` / `common.cancel`). Conversions use local midnight on iOS and UTC midnight on Android, as each platform expects |
| `GroupedList`, `ListSection` | `src/ui/native/list.*` | SwiftUI `List` (`insetGrouped`) with `Section` headers (header trait, test ID on the header) and an optional muted `footer` (the invalid-items note of #112); on Android a React Native `ScrollView` of M3 rows with `primary` section headers (not a Compose `LazyColumn`, so rows can take gesture-handler swipe actions; it is not virtualized, so long real lists need a `FlatList`-based variant first). The list scrolls itself, so it fills a screen instead of sitting in `Screen` |
| `TransactionRow` | `src/ui/native/list.*` | Title, optional meta (due date), signed `AmountText`-style amount in `income` / `expense`, and the paid status. iOS: a `checkmark.circle.fill` / `circle` button named `transaction.paidLabel` ("Paid: <title>") with the toggle trait and selected state. Android: a React Native `Pressable` around the M3 `ListItem` exposes one checkbox with the same name and checked state. Its native ripple is cancelled when a swipe takes over; Compose only presents the content (hidden from accessibility), so its `toggleable` press indication cannot remain stuck on an open row. `currency` is required: each row is formatted in its item's own currency. `showStatus={false}` makes it a status-less row (#112, an item row): no paid control, and the whole row is one accessibility element named by the required `accessibilityLabel` and carrying the test ID. `badge` adds a tinted line of its own under the meta (`primary` on 12 % `primary`, the "Change from {{month}}" of #63) and `amountNote` a muted caption under the amount ("No rate yet" until #92 stores rates). Optional `actions` (`MenuAction`: `key`, `label`, `destructive`) with `onAction` are offered twice over, from one list: by swiping the row to the left (each with the test ID `<testID>-<key>`) and by **a long press**, which opens the same actions in a menu (`<testID>-menu-<key>`) – a SwiftUI `ContextMenu` on iOS, an M3 `DropdownMenu` anchored to the row on Android, where the long press is the discoverable path (#63). **A full swipe performs nothing** (`allowsFullSwipe={false}`): an action that confirms first is chosen on purpose. On iOS the swipe is SwiftUI trailing `swipeActions` (destructive in system red, others `primary`, named `transaction.actionLabel` as on Android; VoiceOver offers them as row actions; the first action is the trailing-most), on Android a `ReanimatedSwipeable` from react-native-gesture-handler (Reanimated) (first action at the outer edge too) with filled M3 buttons in `destructive` / `primary` named `transaction.actionLabel` ("Delete: Rent"), which stay in the accessibility tree while the row is closed so TalkBack users reach them without the swipe. The Android menu is opened by the row's own `onLongPress`: touch stays outside Compose, so its trigger never sees a press of its own |
| `NavigationRow` | `src/ui/native/list.*` | A row that opens a pushed screen: label, spacer, an optional muted `detail` (`footnote` on iOS, `bodySmall` on Android) and a chevron (`chevron.right` on iOS, `assets/icons/chevron_right.xml` on Android, kept out of the accessibility tree). One element, named by `accessibilityLabel` or by `label`; a row that shows a count passes a name that includes it ("Archived items, 2", #112), and `detailTestId` puts a test ID on the count itself |
| `AppContextMenu` | `src/ui/native/context-menu.*` | A button that opens a menu of `actions` (`onAction(key)`): SwiftUI `Menu` (bordered, `ellipsis.circle`, tint `primary`, destructive items in the system style); M3 `DropdownMenu` anchored to an `OutlinedButton`, destructive items in `destructive`. `label` is the visible label and accessible name; items get `<testID>-<key>` |
| `AppSheet` | `src/ui/native/sheet.*` | SwiftUI `BottomSheet` sized to its content with the drag indicator; M3 `ModalBottomSheet` on `card` with the drag handle. Controlled by `visible` / `onDismiss` (swipe down, tap outside, back). The `title` (`title-2`, header role) and the React Native `children` are hosted in the sheet (`RNHostView`); `testID` is on the content |
| `AppAlert` | `src/ui/native/alert.*` | Confirmation with a cancel and a confirm button; `destructive` styles the confirm button for actions such as "Delete"; with no `cancelLabel` it is a notice with one button (the failed save of #63). iOS: the system alert (`UIAlertController` through React Native's `Alert`: Expo UI's SwiftUI `Alert` needs a visible `Alert.Trigger` and did not present from an invisible anchor); Android: M3 `AlertDialog` (`popover` container, confirm in `primary` / `destructive`, buttons `<testID>-confirm` / `<testID>-cancel`). `onDismiss` runs whenever it closes, after a button or a dismiss gesture |
| `AddButton` | `src/ui/native/add-button.*` | iOS: a `plus` icon button in the navigation bar (`headerRight`, tint `primary`); Android: an M3 `FloatingActionButton` (`primary`, bottom end, `assets/icons/add.xml`). `label` is the accessible name |
| `AppSnackbar` | `src/ui/native/snackbar.*` | A short notice that something already happened ("Archived", #63), with no Undo. Android: an M3 `Snackbar` in a `SnackbarHost` over the bottom of the screen, `foreground` on `background` (the inverse surface) and pass-through touch, shown through the host's ref. iOS has no Snackbar, so the same notice is a VoiceOver announcement (`AccessibilityInfo.announceForAccessibility`) and nothing is drawn. `message` is taken once and `onShown` is called as soon as it has been, which is where the owner forgets it |

Native wrappers have a `.ios.tsx` and an `.android.tsx` file; the plain `.tsx` file re-exports the Android one so
TypeScript sees one API. Every wrapper requires a `testID`. Expo UI on Android puts it on a wrapper node, so e2e tests
tap `getByRole("button")` inside it (see [testing](testing.md#e2e-smoke-tests-15)).

The `NativeTabs` bar is tinted with `primary`, and the Router theme uses the tokens for backgrounds, headers and
borders.

## Large text

Text scales with the system setting everywhere (no `allowFontScaling={false}`, no fixed heights around text). Controls
that pair a label with a value stack the label above the control instead of sharing a row, so neither is squeezed at the
largest sizes; long pages scroll. Label/amount rows (the summary card, iOS `TransactionRow`) stay on one line up to the
largest standard size and stack at accessibility sizes / font scale 1.5 and up (`useStackedRows()`, threshold in
`src/ui/large-text.ts`), so neither a word nor an amount is broken mid-way. Check at 200% before merging UI changes (see
[testing](testing.md#large-text-200)); the #182 captures were in
`docs/evidence/` (removed by #241, still in Git history).

### React Native Reusables

RNR components are copied in with the Uniwind registry, from `apps/mobile` (where `metro.config.js` has
`withUniwindConfig`), using `apps/mobile/components.json` and the `@/*` → `src/*` path alias:

```sh
cd apps/mobile
npx @react-native-reusables/cli@latest add --styling-library uniwind <component>
```

Pin the added dependencies exactly and adapt the copy to the tokens (no `font-*` family classes, `rounded-lg`
containers). Do not add RNR versions of controls that exist natively (button, input, switch, checkbox, select,
tabs, menus, dialogs, popover, tooltip, progress). The RNR `doctor` passes with no ignored items:

- `react-native-reanimated` (with `react-native-worklets`) and `react-native-gesture-handler` (Expo SDK 58 versions)
  run the Android `TransactionRow` swipe actions; `GestureHandlerRootView` wraps the root layout.
- `src/ui/lib/theme.ts` (the RNR `lib` alias) holds the typed tokens and `NAV_THEME`, which the root layout passes to
  the navigation `ThemeProvider`.
- `PortalHost` (`@rn-primitives/portal`) is mounted in the root layout and `tailwindcss-animate` is loaded in
  `global.css` (`@plugin`): both are part of the RNR setup that `doctor` checks. Our overlays are native and use neither
  the portal nor the animation classes, so the two exist only for RNR components that may need them.

`expo-doctor` passes.

## Showcase

`/dev/design-system` (`src/app/dev/design-system.tsx`) renders every component, the amount formats, the type scale
and the light and dark colour tokens. It is reachable only in development builds, from the Settings button
`settings-open-design-system`; release builds redirect it to the start screen. All copy uses `dev.designSystem.*`
i18n keys. Its elements use `ds-` test IDs (`ds-card`, `ds-badge`, `ds-amount-income`, `ds-primary-button`,
`ds-toggle`, `ds-segmented`, `ds-progress`, `ds-swatches-light`, the inputs `ds-text-field`, `ds-amount-field`,
`ds-secure-field`, `ds-picker`, `ds-date-picker`, …). `/dev/design-system-list` (from `ds-open-list`, or the deep link
`budget-lens:///dev/design-system-list`) shows `GroupedList`, `TransactionRow` and `AddButton` with example rows
(`ds-list`, `ds-row-rent`, `ds-add-button`) and the row swipe actions: "Edit" (`ds-row-<id>-edit`) opens an
`AppSheet` (`ds-edit-sheet`), "Delete" (`ds-row-<id>-delete`) asks in an `AppAlert` (`ds-delete-alert`) and removes the
row. The showcase's Overlays section has the sheet (`ds-open-sheet`, `ds-sheet`), the alert (`ds-open-alert`,
`ds-alert`) and the menu (`ds-menu`, `ds-menu-<key>`), with the last result in `ds-overlay-result`. Screenshots from
the #119, #182 and #187 e2e runs were in `docs/evidence/` (removed by #241, still in Git history).
