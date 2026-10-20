import type { CurrencyCode, MinorUnits } from "@budget-lens/core";
import type { ReactNode } from "react";
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
  /** 0..1 */
  fraction: number;
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
  title: string;
  testID: string;
  children: ReactNode;
}

export interface TransactionRowProps {
  title: string;
  /** Secondary line, e.g. the due date. */
  meta?: string | undefined;
  amount: MinorUnits;
  /** The item's own currency; the amount is formatted in it. */
  currency: CurrencyCode;
  paid: boolean;
  onPaidChange: (paid: boolean) => void;
  /** Test ID of the paid control (the row on Android, the status button on iOS). */
  testID: string;
  /**
   * Row actions revealed by swiping the row to the left (SwiftUI swipe actions on iOS, a gesture handler swipeable
   * on Android). The first action is the trailing-most; a full swipe on iOS performs it.
   */
  actions?: readonly MenuAction<string>[] | undefined;
  onAction?: ((key: string) => void) | undefined;
}

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
  cancelLabel: string;
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
