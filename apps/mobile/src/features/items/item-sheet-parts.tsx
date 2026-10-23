// The small pieces the item sheet is built from (#82): a read-only row, a validation line, a muted hint, and a
// notice of #64. Month names come from the `monthName` formatter of #112, in the case each sentence needs; the
// picker values themselves stay nominative ("listopad 2026"), per the decisions recorded on #63.
import type { YearMonth } from "@budget-lens/core";
import type { ReactNode } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { Text } from "@/ui/components/text";
import { useThemeColors } from "@/ui/use-theme";

/** A label and a static value: the read-only row of #64, and the fixed type row of an edit. */
export function StaticRow({
  label,
  value,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly testID: string;
}) {
  return (
    <View testID={testID} className="gap-0.5">
      <Text variant="footnote" className="text-muted-foreground">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

/**
 * The message of an error code, or nothing while the field is valid (#63). A field passes its own translator, so
 * the code stays a code here and the namespaces of #63 stay with the fields.
 */
export function errorText<Code extends string>(
  code: Code | undefined,
  message: (code: Code) => string,
): string | undefined {
  return code === undefined ? undefined : message(code);
}

/** A validation message under the control it belongs to (#63: the error is `expense`, never colour alone). */
export function ErrorLine({
  testID,
  text,
}: {
  readonly testID: string;
  readonly text: string | undefined;
}) {
  if (text === undefined) return null;
  return (
    <Text testID={testID} variant="footnote" className="text-expense">
      {text}
    </Text>
  );
}

/** A muted line of explanation under a control (#64). */
export function HintLine({ testID, text }: { readonly testID?: string; readonly text: string }) {
  return (
    <Text testID={testID} variant="footnote" className="text-muted-foreground">
      {text}
    </Text>
  );
}

/** A notice of #64: one container, its heading, its body, and the action it offers. */
export function Notice({
  testID,
  title,
  text,
  children,
}: {
  readonly testID: string;
  readonly title?: string;
  readonly text: string;
  readonly children?: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      className="gap-2 rounded-lg p-4"
      style={{ backgroundColor: theme.accent }}
    >
      {title === undefined ? null : (
        <Text variant="headline" className="text-accent-foreground" accessibilityRole="header">
          {title}
        </Text>
      )}
      <Text variant="subheadline" className="text-accent-foreground">
        {text}
      </Text>
      {children}
    </View>
  );
}

/** How a picker says the month: the string of the month on its own, and of the month it is anchored to. */
export type MonthNamer = (month: YearMonth, isThisMonth: boolean) => string;

/**
 * The options of a month picker: the month the form is anchored to names itself ("October 2026 (this month)"),
 * the rest are nominative and long, so a picker value never carries an inflected case (#63, decision 5).
 */
export function monthChoices(
  months: readonly YearMonth[],
  activeMonth: YearMonth,
  nameMonth: MonthNamer,
): { readonly value: YearMonth; readonly label: string }[] {
  return months.map((month) => ({
    value: month,
    label: nameMonth(month, month === activeMonth),
  }));
}

/**
 * The height a sheet's scrolling body may take: the screen minus the space the sheet itself needs for its
 * title, its handle and the space above it, so the form is a scrolling column that never runs off the screen
 * (#63) and its actions stay reachable at any text size.
 */
function sheetBodyHeight(screenHeight: number): number {
  return Math.max(MIN_SHEET_BODY, screenHeight - SHEET_CHROME);
}

/** Never scroll a sheet into a strip this thin; a small screen simply gets the whole form. */
const MIN_SHEET_BODY = 320;

/** What the sheet keeps for itself around the body: the drag indicator, the title and the padding (#63). */
const SHEET_CHROME = 180;

/**
 * The scrolling body of the item sheet: the form of #63 is one column that is taller than the screen, so the
 * keyboard and the largest text sizes never push its actions out of reach. iOS also lets the keyboard inset the
 * scroll view instead of covering it.
 */
export function SheetScroll({ children }: { readonly children: ReactNode }) {
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      collapsable={false}
      style={{ maxHeight: sheetBodyHeight(height) }}
      contentContainerClassName="gap-4"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}
