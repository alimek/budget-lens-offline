import type { CurrencyCode, Language, MinorUnits } from "@budget-lens/core";
import type { ReactNode } from "react";
import type { AmountSign } from "../amount";
import type { CalendarDate } from "../calendar-date";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
}

export interface ToggleProps {
  /** Visible label; also the accessible name of the switch (VoiceOver / TalkBack read it with the state). */
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID: string;
  disabled?: boolean;
}

export interface ProgressIndicatorProps {
  /** 0..1; omitted for an indeterminate indicator, as the loading state of #112. */
  fraction?: number | undefined;
  color: string;
  trackColor: string;
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  testID: string;
}

export interface TextFieldProps {
  /** Visible label and accessible name of the field. */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  testID: string;
  placeholder?: string | undefined;
  /** `decimal` opens the decimal keyboard (amounts); `secure` hides the text (recovery secret). */
  kind?: "text" | "decimal" | "secure";
  /** Shown below the field in `expense`, and announced with the field. */
  error?: string | undefined;
}

export interface PickerOption<T extends string> {
  value: T;
  label: string;
}

export interface PickerProps<T extends string> {
  /** Visible label and accessible name of the picker. */
  label: string;
  /**
   * Hide the visible caption and keep `label` as the accessible name only: for a picker that sits inside another
   * control's row, where a caption of its own would read as a second field.
   */
  hideLabel?: boolean | undefined;
  options: readonly PickerOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  testID: string;
}

export interface DatePickerProps {
  /** Visible label and accessible name of the picker. */
  label: string;
  value: CalendarDate;
  onValueChange: (value: CalendarDate) => void;
  testID: string;
}

/** The "Every N months" stepper of #63: a native stepper on iOS, a field with ± buttons on Android. */
export interface StepperProps {
  /** Visible label and accessible name, naming the value it holds ("Every 4 months"). */
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  /** Accessible name of the Android minus button; the iOS stepper names its own. */
  decreaseLabel: string;
  /** Accessible name of the Android plus button. */
  increaseLabel: string;
  /** Test ID of the control; the Android buttons get `<testID>-decrease` and `<testID>-increase`. */
  testID: string;
}

/** One currency of the amount input's picker, labelled the way the #61 menu lists it ("USD · US dollar"). */
export interface AmountCurrencyOption {
  value: CurrencyCode;
  label: string;
}

/**
 * The amount field of #61: a decimal field whose value is read against a currency, with the currency inside the
 * field. The field holds raw text: it never rewrites what the user typed while it is focused, and reformats a
 * valid value only when it loses focus.
 */
export interface AmountInputProps {
  /** Visible label and accessible name of the field ("Amount"). */
  label: string;
  /** What the field holds; the caller owns it, so the field can be re-read after a currency change. */
  value: string;
  /** The language the value is rewritten in when the field loses focus (#61, decision 2). */
  lang: Language;
  onChangeText: (value: string) => void;
  /** The currency the amount is counted in. */
  currency: CurrencyCode;
  /** The currencies the picker offers, in the order of #61 (base, then used, then A–Z). */
  currencies: readonly AmountCurrencyOption[];
  /** Omitted when the currency is locked: an existing item keeps its currency (#82). */
  onCurrencyChange?: ((currency: CurrencyCode) => void) | undefined;
  /** Placeholder of the empty field: the zero of the app language in the currency's digits. */
  placeholder: string;
  /** Error under the field, in `expense`; absent while what is typed is valid. */
  error?: string | undefined;
  /** Helper line under the field (#63's amount hint, or the reason the currency is locked). */
  helper?: string | undefined;
  /** Base-value line of a foreign amount (#61), or its no-rate state; `muted-foreground`. */
  hint?: string | undefined;
  /** Label of the iOS keyboard's Done button: the decimal pad has no return key of its own (#61). */
  doneLabel: string;
  /** Accessible name of the currency control, read with its value (#61 `currencyA11y`). */
  currencyAccessibilityLabel?: string | undefined;
  /** Accessible name of the amount itself, e.g. "expense, 240,00" (#61 `a11y.value`). */
  accessibilityLabel?: string | undefined;
  /** Test ID of the field; the currency control takes `<testID>-currency`. */
  testID: string;
}

export interface AddButtonProps {
  /** Accessible name of the icon-only button, e.g. "Add item". */
  label: string;
  onPress: () => void;
  testID: string;
}

export interface GroupedListProps {
  testID: string;
  children: ReactNode;
}

export interface ListSectionProps {
  /** Section header; a section without one is a plain card, as the archived row of #112. */
  title?: string;
  /** Test ID of the header, and therefore omitted when the section has none. */
  testID?: string;
  /** Muted line under the rows: the invalid-items note (#112), the form preview (#82). */
  footer?: string | undefined;
  children: ReactNode;
}

/** A row that opens a pushed screen: label on the left, an optional count and a chevron on the right (#112). */
export interface NavigationRowProps {
  /** Visible label of the row; the accessible name is `accessibilityLabel` when one is given. */
  label: string;
  /** Muted count before the chevron, e.g. how many items are archived. Not part of the name unless asked for. */
  detail?: string | undefined;
  /** Accessible name of the row; `label` by default. Pass the label with its count to keep them read together. */
  accessibilityLabel?: string | undefined;
  onPress: () => void;
  testID: string;
  /** Test ID of the `detail` itself, for a test that reads the count back. */
  detailTestId?: string | undefined;
}

/**
 * The fields every row shows, with or without a status: the texts, the amount, the optional badge under them and
 * the optional note under the amount.
 */
interface RowContentProps {
  title: string;
  /** Secondary line, e.g. the due date or the recurrence summary. */
  meta?: string | undefined;
  amount: MinorUnits;
  /** The item's own currency; the amount is formatted in it. */
  currency: CurrencyCode;
  /** `always` also signs a positive amount with `+`; the Items list signs every row by its kind. */
  sign?: AmountSign | undefined;
  /** Tinted badge on a line of its own under the meta, e.g. "Change from Feb 2027". */
  badge?: string | undefined;
  /** Muted note under the amount, e.g. "No rate yet" for a foreign item (#92 adds the base value). */
  amountNote?: string | undefined;
  /** Test ID of the row. */
  testID: string;
  /**
   * Row actions: revealed by swiping the row to the left (SwiftUI swipe actions on iOS, a gesture handler
   * swipeable on Android) and, on a long press, by a menu (SwiftUI `ContextMenu` on iOS, an M3 `DropdownMenu`
   * anchored to the row on Android). The same list drives both, so a row never offers an action twice over.
   * The first action is the trailing-most; on iOS a full swipe does not perform one, because an action that
   * confirms first must be tapped on purpose (#63).
   *
   * The swipe buttons carry `<testID>-<key>` and the menu items `<testID>-menu-<key>`.
   */
  actions?: readonly MenuAction<string>[] | undefined;
  onAction?: ((key: string) => void) | undefined;
}

/** A row with the paid status: the month view, where the whole row is the paid control. */
export type PaidRowProps = RowContentProps & {
  paid: boolean;
  onPaidChange: (paid: boolean) => void;
  /** Test ID of the paid control (the row on Android, the status button on iOS). */
  showStatus?: true | undefined;
  accessibilityLabel?: string | undefined;
};

/**
 * A status-less row (`showStatus={false}`): an item row, which has no paid state to show (#63). It is one
 * accessibility element named by `accessibilityLabel`, and the whole row is the button that opens the item
 * sheet (#82) – absent on a list whose rows open nothing, such as the archived one.
 */
export type StatuslessRowProps = RowContentProps & {
  showStatus: false;
  /** Accessible name of the whole row: name, kind, amount and summary as one sentence. */
  accessibilityLabel: string;
  /** Tapping the row; the row is not a button without it. */
  onPress?: (() => void) | undefined;
  paid?: undefined;
  onPaidChange?: undefined;
};

export type TransactionRowProps = PaidRowProps | StatuslessRowProps;

/** One action of a menu or a row (context menu items, swipe actions). */
export interface MenuAction<K extends string> {
  key: K;
  label: string;
  /** Styled as destructive (system red on iOS, `destructive` on Android). */
  destructive?: boolean;
}

export interface ContextMenuProps<K extends string> {
  /** Visible label and accessible name of the button that opens the menu. */
  label: string;
  actions: readonly MenuAction<K>[];
  onAction: (key: K) => void;
  /** Test ID of the trigger button; each item gets `<testID>-<key>` where the platform exposes it. */
  testID: string;
}

/**
 * A short confirmation of something that already happened ("Archived", #63). The component shows `message` once
 * and calls `onShown` as soon as it has taken it over, so the owner clears it there; it renders nothing itself on
 * iOS, where the same notice is an accessibility announcement.
 */
export interface SnackbarProps {
  /** The message to show, or none while nothing is pending. */
  message: string | undefined;
  /** Called once the notice has been shown or announced: the place to forget the message. */
  onShown: () => void;
  /** Test ID of the notice, where the platform exposes one. */
  testID: string;
}

export interface SheetProps {
  visible: boolean;
  /** Called when the sheet closes: swipe down, tap outside, back, or after `visible` turns false. */
  onDismiss: () => void;
  /** Sheet title (`title-2`), announced as a heading. */
  title: string;
  /** React Native content below the title. */
  children: ReactNode;
  /** Test ID of the sheet content. */
  testID: string;
}

export interface AlertProps {
  visible: boolean;
  title: string;
  message?: string | undefined;
  confirmLabel: string;
  /** Omit for a notice the user only acknowledges: one button, no cancel. */
  cancelLabel?: string | undefined;
  /** Styles the confirm button as destructive (for example "Delete"). */
  destructive?: boolean;
  onConfirm: () => void;
  /** Called whenever the alert closes, after a button or a dismiss gesture. */
  onDismiss: () => void;
  /**
   * Buttons get `<testID>-confirm` / `<testID>-cancel` on Android. A SwiftUI alert is a system alert whose buttons
   * carry no identifiers; tests find it by its `alert` role.
   */
  testID: string;
}
