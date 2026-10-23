# Midnight Premium design tokens (#245)

The visual language of Budget Lens from 2026-10-23, decided in
[#245](https://github.com/alimek/budget-lens-offline/issues/245) (see [decisions](../decisions.md)):

- **Style:** direction C, **Midnight Premium**.
- **Components:** [React Native Reusables](https://reactnativereusables.com) (RNR, shadcn/ui for React Native),
  restyled to our own look and feel with the tokens below.

Proposal (not an owner decision): platform-native pickers and sheets may still be used where RNR has no equivalent.

The Figma file of #245 holds the same values: page **Components** (variables, styles and all components, light and
dark) and page **Design system – Midnight Premium** (reference screens). Figma variable names are identical to the
token names below: collection **Theme** (modes Light / Dark) for colours and elevation values, collection **Layout**
for spacing and radii.

## Colours

The RNR / shadcn names come first, then the Budget Lens extras. Text pairs meet WCAG AA (4.5:1 for body text) on the
surfaces they are used on.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#F4F5F9` | `#07080F` | screen background |
| `foreground` | `#0E1022` | `#F3F4FA` | titles, item names, amounts |
| `card` / `card-foreground` | `#FFFFFF` / `#0E1022` | `#0E1020` / `#F3F4FA` | cards and grouped lists (solid form) |
| `popover` / `popover-foreground` | `#FFFFFF` / `#0E1022` | `#13152A` / `#F3F4FA` | select content, menus, dialogs, sheets |
| `primary` / `primary-foreground` | `#3F4BA8` / `#FFFFFF` | `#A9B0FF` / `#0B0C1A` | accent: active tab, links, icons, sparkline (on `card`: 7.55:1 light / 9.29:1 dark) |
| `secondary` / `secondary-foreground` | `#ECEDF3` / `#0E1022` | `#1A1D33` / `#F3F4FA` | secondary buttons, chips, sign toggle |
| `muted` / `muted-foreground` | `#ECEDF3` / `#5A5F78` | `#0E1020` / `#9A9FB8` | tab track, skeleton / meta text, captions (on `muted`: 5.38:1 light / 7.21:1 dark) |
| `accent` / `accent-foreground` | `#ECEDF6` / `#3F4BA8` | `#202136` / `#A9B0FF` | pressed ghost/outline, selected item, active tab pill |
| `destructive` / `destructive-foreground` | `#C0392B` / `#FFFFFF` | `#FF6B5E` / `#1A0705` | delete actions and errors only |
| `border` | `#E3E5EE` | `rgba(255,255,255,0.08)` | 1 pt borders and inset separators |
| `input` | `#D9DCE7` | `rgba(255,255,255,0.12)` | field borders, unchecked switch track |
| `ring` | `#3F4BA8` | `#A9B0FF` | focus ring (3 pt at 30 %) |
| `chart-1` … `chart-5` | `#3F4BA8` `#0B7A68` `#A15C07` `#0369A1` `#BE185D` | `#A9B0FF` `#5FD8BE` `#F5C26B` `#7CC4F5` `#F59AC0` | charts |
| `income` | `#0B7A68` | `#5FD8BE` | income amounts (with `+`) |
| `expense` | `#0E1022` | `#F3F4FA` | expense amounts: same as `foreground`, marked by the `−` sign, not by red |
| `subtle-foreground` | `#686D86` | `#8A8FA8` | placeholders; only on `card` / `background` (light 5.10:1 / 4.68:1, dark 5.90:1 / 6.26:1) |
| `surface-raised` | `#FFFFFF` | `#1E2140` | active tab trigger, switch thumb |
| `surface-inset` | `#F6F7FA` | `rgba(255,255,255,0.03)` | stat tiles inside a card |
| `surface-ended` | `#EEF0F5` | `#0B0C17` | ended / archived rows (dashed `border`) |
| `card-gradient-from` → `card-gradient-to` | `#FFFFFF` → `#FBFBFD` | `#13152A` → `#0D0E1B` | card surface, top → bottom |
| `primary-gradient-from` → `primary-gradient-to` | `#5461C8` → `#3F4BA8` | `#B4BAFF` → `#8E97F5` | primary button and add button |
| `glass-surface` / `glass-border` | `rgba(255,255,255,0.78)` / `rgba(14,16,34,0.07)` | `rgba(18,20,38,0.72)` / `rgba(255,255,255,0.09)` | floating tab bar |
| `background-glow` | transparent | `rgba(88,101,242,0.20)` | radial glow at the top of dark screens and in the summary card |
| `glow` | `rgba(14,16,34,0.12)` | `rgba(88,101,242,0.35)` | card elevation: shadow in light, indigo glow in dark |
| `glow-primary` | `rgba(63,75,168,0.55)` | `rgba(142,151,245,0.65)` | primary button elevation |
| `shadow-ambient` / `shadow-floating` | `rgba(14,16,34,0.04)` / `rgba(14,16,34,0.18)` | transparent / `rgba(0,0,0,0.80)` | contact shadow / floating surfaces |
| `highlight` | `#FFFFFF` | `rgba(255,255,255,0.07)` | 1 pt inner top highlight on cards and glass |
| `scrim` | `rgba(14,16,34,0.40)` | `rgba(0,0,0,0.60)` | behind dialogs and sheets |
| `category-salary` · `-housing` · `-energy` · `-internet` · `-health` · `-transport` · `-ended` | `#0B7A68` `#3F4BA8` `#A15C07` `#0369A1` `#BE185D` `#6D28D9` `#5A5F78` | `#5FD8BE` `#A9B0FF` `#F5C26B` `#7CC4F5` `#F59AC0` `#C3A6FF` `#9A9FB8` | category icon; its container is the same colour at 14 % |

### CSS variables

The app styles with Uniwind, so the tokens use the conventions of `apps/mobile/global.css`: colours under
`@layer theme` → `:root` → `@variant light` / `@variant dark`, each named `--color-<token>` (used as classes such as
`bg-card`, `text-subtle-foreground`, `text-category-salary`), and radii in `@theme`. Both variants define the same
tokens in the same order. When the new UI lands, this block replaces the Indigo colours in `global.css`, and
`src/ui/lib/theme.ts` (the typed object for non-class styling: navigation theme, gradients, SVG) mirrors it.

```css
/* apps/mobile/global.css, colour tokens (Midnight Premium) */
@layer theme {
  :root {
    @variant light {
      --color-background: #f4f5f9;
      --color-foreground: #0e1022;
      --color-card: #ffffff;
      --color-card-foreground: #0e1022;
      --color-popover: #ffffff;
      --color-popover-foreground: #0e1022;
      --color-primary: #3f4ba8;
      --color-primary-foreground: #ffffff;
      --color-secondary: #ecedf3;
      --color-secondary-foreground: #0e1022;
      --color-muted: #ecedf3;
      --color-muted-foreground: #5a5f78;
      --color-accent: #ecedf6;
      --color-accent-foreground: #3f4ba8;
      --color-destructive: #c0392b;
      --color-destructive-foreground: #ffffff;
      --color-border: #e3e5ee;
      --color-input: #d9dce7;
      --color-ring: #3f4ba8;
      --color-chart-1: #3f4ba8;
      --color-chart-2: #0b7a68;
      --color-chart-3: #a15c07;
      --color-chart-4: #0369a1;
      --color-chart-5: #be185d;
      /* Budget Lens extras */
      --color-income: #0b7a68;
      --color-expense: #0e1022;
      --color-subtle-foreground: #686d86;
      --color-surface-raised: #ffffff;
      --color-surface-inset: #f6f7fa;
      --color-surface-ended: #eef0f5;
      --color-card-gradient-from: #ffffff;
      --color-card-gradient-to: #fbfbfd;
      --color-primary-gradient-from: #5461c8;
      --color-primary-gradient-to: #3f4ba8;
      --color-glass-surface: rgba(255, 255, 255, 0.78);
      --color-glass-border: rgba(14, 16, 34, 0.07);
      --color-background-glow: rgba(88, 101, 242, 0);
      --color-glow: rgba(14, 16, 34, 0.12);
      --color-glow-primary: rgba(63, 75, 168, 0.55);
      --color-shadow-ambient: rgba(14, 16, 34, 0.04);
      --color-shadow-floating: rgba(14, 16, 34, 0.18);
      --color-highlight: #ffffff;
      --color-scrim: rgba(14, 16, 34, 0.4);
      --color-category-salary: #0b7a68;
      --color-category-housing: #3f4ba8;
      --color-category-energy: #a15c07;
      --color-category-internet: #0369a1;
      --color-category-health: #be185d;
      --color-category-transport: #6d28d9;
      --color-category-ended: #5a5f78;
    }
    @variant dark {
      --color-background: #07080f;
      --color-foreground: #f3f4fa;
      --color-card: #0e1020;
      --color-card-foreground: #f3f4fa;
      --color-popover: #13152a;
      --color-popover-foreground: #f3f4fa;
      --color-primary: #a9b0ff;
      --color-primary-foreground: #0b0c1a;
      --color-secondary: #1a1d33;
      --color-secondary-foreground: #f3f4fa;
      --color-muted: #0e1020;
      --color-muted-foreground: #9a9fb8;
      --color-accent: #202136;
      --color-accent-foreground: #a9b0ff;
      --color-destructive: #ff6b5e;
      --color-destructive-foreground: #1a0705;
      --color-border: rgba(255, 255, 255, 0.08);
      --color-input: rgba(255, 255, 255, 0.12);
      --color-ring: #a9b0ff;
      --color-chart-1: #a9b0ff;
      --color-chart-2: #5fd8be;
      --color-chart-3: #f5c26b;
      --color-chart-4: #7cc4f5;
      --color-chart-5: #f59ac0;
      /* Budget Lens extras */
      --color-income: #5fd8be;
      --color-expense: #f3f4fa;
      --color-subtle-foreground: #8a8fa8;
      --color-surface-raised: #1e2140;
      --color-surface-inset: rgba(255, 255, 255, 0.03);
      --color-surface-ended: #0b0c17;
      --color-card-gradient-from: #13152a;
      --color-card-gradient-to: #0d0e1b;
      --color-primary-gradient-from: #b4baff;
      --color-primary-gradient-to: #8e97f5;
      --color-glass-surface: rgba(18, 20, 38, 0.72);
      --color-glass-border: rgba(255, 255, 255, 0.09);
      --color-background-glow: rgba(88, 101, 242, 0.2);
      --color-glow: rgba(88, 101, 242, 0.35);
      --color-glow-primary: rgba(142, 151, 245, 0.65);
      --color-shadow-ambient: rgba(0, 0, 0, 0);
      --color-shadow-floating: rgba(0, 0, 0, 0.8);
      --color-highlight: rgba(255, 255, 255, 0.07);
      --color-scrim: rgba(0, 0, 0, 0.6);
      --color-category-salary: #5fd8be;
      --color-category-housing: #a9b0ff;
      --color-category-energy: #f5c26b;
      --color-category-internet: #7cc4f5;
      --color-category-health: #f59ac0;
      --color-category-transport: #c3a6ff;
      --color-category-ended: #9a9fb8;
    }
  }
}

@theme {
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-3xl: 24px;
}
```

Values are hex / rgba so they can be used as they are. The category colours reuse the palette (`income`, `primary`
and the chart hues, plus a violet for transport and `muted-foreground` for ended); the icon container is the same
colour at 14 %.

## Typography

The app keeps the **platform system font** (SF Pro on iOS, Roboto on Android) and does not set `fontFamily`; the
Figma text styles use Inter only as a stand-in. Sizes are points and scale with the system text size. Amounts always
use **tabular figures** (`fontVariant: ["tabular-nums"]`) and the real minus `−` (U+2212).

| Text style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `title-large` | 30 / 36, tracking −0.6 | 700 | screen title |
| `amount-hero` | 36 / 40, tracking −1.2 | 300 | summary figure; the currency next to it is `body` in `muted-foreground` |
| `title` | 22 / 28, tracking −0.3 | 700 | dialog, sheet and empty-state titles; amount input value |
| `body` | 15 / 22 | 400 | body text, field values |
| `row-title` | 15 / 20 | 500 | item name |
| `amount` | 15 / 20 | 600 | row amounts (500 and struck through for ended rows) |
| `button` / `button-sm` | 15 / 20, 14 / 20 | 600 | buttons |
| `segment` | 14 / 20 | 500 (600 active) | tabs / segmented control |
| `label` | 13 / 16 | 500 | field labels, card labels |
| `meta` | 12 / 16 | 400 | cadence, helper text, stat labels |
| `section` | 11 / 16, tracking +0.8, uppercase | 600 | section headers |
| `caption` | 11 / 16 | 500 | badges |
| `tab` | 10 / 12 | 500 (600 active) | tab bar labels |

## Spacing and radii

A 4 pt grid: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32
(the default Tailwind spacing scale, so `p-4` = 16). Screen margin 16, card padding 16–20, list rows 52 pt (64 pt
with a badge). Every touch target is at least 44 × 44 pt (RNR `sm` sizes get `hitSlop`).

`--radius` is 12 pt; the shadcn derived radii follow from it: `radius-sm` 8, `radius-md` 10, `radius-lg` 12,
`radius-xl` 16. Extras: `radius-2xl` 20 (list cards), `radius-3xl` 24 (summary card, dialogs, sheets, tab bar),
`radius-full` (buttons, badges, switches). Today's `global.css` has `radius-sm` 6 and `md` 8 and the `Text` variants
use the #58 type scale names; both move to the values and names above with the new UI.

## Elevation

Effect styles in Figma, with colours and offsets bound to Theme variables so they switch with the mode:

| Effect style | Light | Dark |
| --- | --- | --- |
| `elevation/card` | `0 1 2 shadow-ambient` + `0 8 24 −10 glow` + 1 pt inner `highlight` | `0 24 48 −24 glow` (indigo glow) + inner `highlight` |
| `elevation/primary` | `0 6 16 −6 glow-primary` | `0 8 24 −8 glow-primary` |
| `elevation/floating` | `0 10 30 −8 shadow-floating` + inner `highlight` | `0 16 40 −12 shadow-floating` + inner `highlight` |
| `elevation/sm` | `0 1 2` + `0 2 6 −2` soft shadow | same, nearly invisible |
| `focus-ring` | 3 pt spread in `ring` at 30 % | same |
| `glass-blur` | 24 pt background blur | same |

In React Native, `boxShadow` takes these CSS-style values on iOS and Android. Keep the glow tasteful: one glowing
element per area, never on list rows.

## Glass tab bar

Floats 16 pt from the screen sides and 22 pt above the bottom safe area: 64 pt high, `radius-3xl`, five 56 pt items,
the active item in `accent-foreground` on an `accent` pill. Fill `glass-surface` over an `expo-blur` `BlurView`
(intensity ≈ 40; on Android `experimentalBlurMethod="dimezisBlurView"`), 1 pt `glass-border`, `elevation/floating`.
With "Reduce Transparency" on, or where blur is unavailable, the fill is used at 94 % alpha.

## Gradients, charts and motion

`expo-linear-gradient` for card surfaces and primary buttons; `react-native-svg` for the sparkline (2 pt `primary`
line, area at 14 %), the Lucide icons (1.75 pt stroke) and the background glows. Reanimated for the tab thumb,
section collapse and the 0.97 press scale; respect "Reduce Motion".

## Components

The Figma page holds one component (set) per entry, each bound to the variables above, with a light column (the
component sets) and a dark column (the same variants as instances in Dark mode).

| Figma component | Variants | Built on |
| --- | --- | --- |
| `Button` | Variant default / destructive / outline / secondary / ghost / link × Size default / sm / lg / icon; State Pressed / Disabled | RNR `Button` |
| `Badge` | default / secondary / destructive / outline / soft / income | RNR `Badge` (+ `soft`, `income`) |
| `Label` | – | RNR `Label` |
| `Separator` | horizontal / vertical | RNR `Separator` |
| `Input` | Default / Focused / Error / Disabled (with label and helper text) | RNR `Input` + `Label` |
| `Textarea` | Default / Focused | RNR `Textarea` |
| `Select` | Closed / Open | RNR `Select` |
| `Switch` | Checked × Disabled | RNR `Switch` |
| `Checkbox` | Checked | RNR `Checkbox` |
| `RadioGroup` | Checked | RNR `RadioGroup` |
| `Toggle` | default / outline × Pressed | RNR `Toggle` / `ToggleGroup` |
| `Tabs` | Active = 1 of 3 | RNR `Tabs` (styled as a segmented control) |
| `Progress` | 25 / 60 / 100 | RNR `Progress` |
| `Skeleton` | – | RNR `Skeleton` |
| `Alert` | default / destructive | RNR `Alert` |
| `Card` | – | RNR `Card` |
| `DropdownMenu` | – | RNR `DropdownMenu` (also `ContextMenu`, `Popover`) |
| `Dialog` | – | RNR `Dialog` |
| `AlertDialog` | – | RNR `AlertDialog` |
| `SummaryCard` | – | custom, on RNR `Card` |
| `ListRow` | income / expense / ended × badge | custom |
| `SectionHeader` | collapsed / expanded | custom |
| `CategoryIcon` | salary / housing / energy / internet / health / transport / ended | custom |
| `AmountInput` | sign minus / plus | custom, on RNR `Input` |
| `AddButton` | Default / Pressed / Disabled | custom (floating add button) |
| `FloatingTabBar` | Active = 1 of 5 | custom |
| `EmptyState` | – | custom |
| `BottomSheet` | – | custom (RNR has none; a native sheet where available) |
| `Snackbar` | – | custom (RNR has no toast) |

How today's shared wrappers in `apps/mobile/src/ui/native` map: `PrimaryButton` / `SecondaryButton` → `Button`
(default / secondary), `AddButton` → `AddButton`, `AppTextField` → `Input`, `AppPicker` → `Select`, `AppToggle` →
`Switch`, `SegmentedControl` → `Tabs`, `AppAlert` → `AlertDialog`, `AppContextMenu` → `DropdownMenu`, `AppSheet` →
`BottomSheet`, `AppSnackbar` → `Snackbar`, `TransactionRow` → `ListRow`, `GroupedList` / `ListSection` → `Card` +
`SectionHeader`, `ProgressIndicator` → `Progress` (and a spinner), `AppDatePicker` → stays platform-native.
