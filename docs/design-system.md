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
- `apps/mobile/src/ui/theme.ts`: the same values as a typed object for native props that take colours (tab tint,
  Expo UI tints, navigation theme). `useThemeColors()` returns the set for the system appearance;
  `useDynamicColor(token)` returns a `DynamicColorIOS` on iOS.
- `src/ui/theme.test.ts` fails when `global.css` and `theme.ts` drift apart (run by `pnpm test` in CI).
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
| `ProgressIndicator` | `src/ui/native/progress-indicator.*` | SwiftUI `ProgressView`; M3 `LinearProgressIndicator`; decorative, used by `BudgetProgress` |

Native wrappers have a `.ios.tsx` and an `.android.tsx` file; the plain `.tsx` file re-exports the Android one so
TypeScript sees one API. Every wrapper requires a `testID`. Expo UI on Android puts it on a wrapper node, so e2e tests
tap `getByRole("button")` inside it (see [testing](testing.md#e2e-smoke-tests-15)).

The `NativeTabs` bar is tinted with `primary`, and the Router theme uses the tokens for backgrounds, headers and
borders.

### React Native Reusables

RNR components are copied in with the Uniwind registry, from `apps/mobile` (where `metro.config.js` has
`withUniwindConfig`), using `apps/mobile/components.json` and the `@/*` → `src/*` path alias:

```sh
cd apps/mobile
npx @react-native-reusables/cli@latest add --styling-library uniwind <component>
```

Pin the added dependencies exactly and adapt the copy to the tokens (no `font-*` family classes, `rounded-lg`
containers). Do not add RNR versions of controls that exist natively (button, input, switch, checkbox, select,
tabs, menus, dialogs, popover, tooltip, progress). `doctor` still reports `react-native-reanimated`,
`tailwindcss-animate`, a `lib/theme.ts` file and `PortalHost`: these are only needed by animated or portal-based RNR
components, which this app does not use.

## Showcase

`/dev/design-system` (`src/app/dev/design-system.tsx`) renders every component, the amount formats, the type scale
and the light and dark colour tokens. It is reachable only in development builds, from the Settings button
`settings-open-design-system`; release builds redirect it to the start screen. All copy uses `dev.designSystem.*`
i18n keys. Its elements use `ds-` test IDs (`ds-card`, `ds-badge`, `ds-amount-income`, `ds-primary-button`,
`ds-toggle`, `ds-segmented`, `ds-progress`, `ds-swatches-light`, …). Screenshots from the e2e run are in
[evidence/119](evidence/119/README.md).
