import { type CurrencyCode, currencyExponent } from "@budget-lens/core";
import {
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  Host,
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  clickable,
  defaultMinSize,
  fillMaxWidth,
  menuAnchor,
  semantics,
  testID as testIDModifier,
} from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { View } from "react-native";
import { formatAmountNumber } from "../amount";
import { reformatAmountOnBlur } from "../amount-input";
import { Text as AppText } from "../components/text";
import { useThemeColors } from "../use-theme";
import type { AmountInputProps } from "./types";
import { useSyncedText } from "./use-synced-text";

/** #61's decision 1 (variant A): the `PLN ▾` of the field, with a touch target of at least 48 dp. */
const CURRENCY_TARGET = 48;

/**
 * The amount field of #61 on Android: an M3 `OutlinedTextField` whose value is right-aligned with tabular
 * figures, and whose trailing slot is the currency itself — a `PLN ▾` that opens an exposed dropdown anchored to
 * the field (variant A, [#61 decision 1](https://github.com/alimek/budget-lens-offline/issues/61#issuecomment-6336318585)).
 * A locked currency is the same slot without the menu. The field owns its text while focused and rewrites a
 * valid value to the app language only when it loses focus, which `imeAction: done` triggers as well.
 */
export function AmountInput(props: AmountInputProps) {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const text = useNativeState(props.value);
  const handleChange = useSyncedText(text, props.value, props.onChangeText);
  const done = () => {
    const formatted = reformatAmountOnBlur(text.get(), props.currency, (amount) =>
      formatAmountNumber(amount, { lang: props.lang, currency: props.currency }),
    );
    text.set(formatted);
    handleChange(formatted);
  };
  const change = props.onCurrencyChange;
  return (
    <View className="self-stretch">
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        <ExposedDropdownMenuBox
          expanded={expanded}
          onExpandedChange={setExpanded}
          modifiers={[fillMaxWidth()]}
        >
          <AmountField
            props={props}
            text={text}
            onTextChange={handleChange}
            onDone={done}
            onOpenCurrency={() => setExpanded(true)}
            colors={fieldColors(theme)}
          />
          {change === undefined ? null : (
            <CurrencyMenu
              props={{ currencies: props.currencies, testID: props.testID }}
              onCurrencyChange={change}
              expanded={expanded}
              onDismiss={() => setExpanded(false)}
              background={theme.popover}
              foreground={theme["popover-foreground"]}
            />
          )}
        </ExposedDropdownMenuBox>
      </Host>
      <AmountNotes props={props} />
    </View>
  );
}

interface AmountFieldProps {
  readonly props: AmountInputProps;
  readonly text: ReturnType<typeof useNativeState<string>>;
  readonly onTextChange: (next: string) => void;
  readonly onDone: () => void;
  readonly onOpenCurrency: () => void;
  readonly colors: NonNullable<Parameters<typeof OutlinedTextField>[0]["colors"]>;
}

/** The M3 field itself: the right-aligned value, the currency in its trailing slot, and the error line. */
function AmountField({
  props,
  text,
  onTextChange,
  onDone,
  onOpenCurrency,
  colors,
}: AmountFieldProps) {
  return (
    <OutlinedTextField
      value={text}
      onValueChange={onTextChange}
      onFocusChanged={(focused) => {
        if (focused === false) onDone();
      }}
      singleLine
      isError={props.error !== undefined}
      keyboardOptions={{
        keyboardType: currencyExponent(props.currency) === 0 ? "number" : "decimal",
        imeAction: "done",
      }}
      keyboardActions={{ onDone }}
      textStyle={{ textAlign: "right" }}
      colors={colors}
      modifiers={[
        fillMaxWidth(),
        semantics({ contentDescription: fieldDescription(props) }),
        testIDModifier(props.testID),
      ]}
    >
      <OutlinedTextField.Label>
        <Text>{props.label}</Text>
      </OutlinedTextField.Label>
      <FieldPlaceholder text={props.placeholder} />
      <OutlinedTextField.Suffix>
        <CurrencySuffix props={props} onOpen={onOpenCurrency} />
      </OutlinedTextField.Suffix>
      <FieldError text={props.error} testID={`${props.testID}-error`} />
    </OutlinedTextField>
  );
}

/**
 * What the field announces: its name, the kind of amount and the amount itself, as one sentence (#61). Compose
 * reads the content description instead of the text of a field that has one, so the value belongs in it.
 */
function fieldDescription(props: AmountInputProps): string {
  return [props.label, props.kindLabel, props.value]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
}

/** The empty field's placeholder, which Compose only renders when the caller gives one. */
function FieldPlaceholder({ text }: { readonly text: string | undefined }) {
  if (text === undefined || text === "") return null;
  return (
    <OutlinedTextField.Placeholder>
      <Text>{text}</Text>
    </OutlinedTextField.Placeholder>
  );
}

/** The error under the field, which Compose shows as the field's supporting text (#61). */
function FieldError({
  text,
  testID,
}: {
  readonly text: string | undefined;
  readonly testID: string;
}) {
  if (text === undefined) return null;
  return (
    <OutlinedTextField.SupportingText>
      <Text modifiers={[testIDModifier(testID)]}>{text}</Text>
    </OutlinedTextField.SupportingText>
  );
}

interface CurrencySuffixProps {
  readonly props: AmountInputProps;
  readonly onOpen: () => void;
}

/**
 * The field's trailing slot (#61, variant A): the code with its chevron, opening a dropdown anchored to the
 * field, or the code alone once the item's currency is locked. Either way its touch target is at least 48 dp.
 */
function CurrencySuffix({ props, onOpen }: CurrencySuffixProps) {
  const change = props.onCurrencyChange;
  const locked = change === undefined;
  return (
    <Text
      modifiers={[
        defaultMinSize({ minWidth: CURRENCY_TARGET, minHeight: CURRENCY_TARGET }),
        semantics({
          contentDescription:
            props.currencyAccessibilityLabel ?? `${props.currency} ${props.label}`,
        }),
        testIDModifier(`${props.testID}-currency`),
        ...(locked ? [] : [menuAnchor(), clickable(onOpen)]),
      ]}
    >
      {locked ? props.currency : `${props.currency} ▾`}
    </Text>
  );
}

interface CurrencyMenuProps {
  readonly props: Pick<AmountInputProps, "currencies" | "testID">;
  readonly onCurrencyChange: (currency: CurrencyCode) => void;
  readonly expanded: boolean;
  readonly onDismiss: () => void;
  readonly background: string;
  readonly foreground: string;
}

/** The exposed dropdown of #61's variant A: every currency the picker offers, in the order the caller ordered. */
function CurrencyMenu(props: CurrencyMenuProps) {
  const { currencies, testID } = props.props;
  return (
    <ExposedDropdownMenu
      expanded={props.expanded}
      onDismissRequest={props.onDismiss}
      containerColor={props.background}
    >
      {currencies.map((option) => (
        <DropdownMenuItem
          key={option.value}
          elementColors={{ textColor: props.foreground }}
          modifiers={[testIDModifier(`${testID}-currency-${option.value}`)]}
          onClick={() => {
            props.onCurrencyChange(option.value);
            props.onDismiss();
          }}
        >
          <DropdownMenuItem.Text>
            <Text>{option.label}</Text>
          </DropdownMenuItem.Text>
        </DropdownMenuItem>
      ))}
    </ExposedDropdownMenu>
  );
}

/** The muted lines of #61 under the Compose field, which owns its own supporting text. */
function AmountNotes({ props }: { readonly props: AmountInputProps }) {
  return (
    <>
      {props.hint === undefined ? null : (
        <AppText
          variant="footnote"
          className="text-muted-foreground pt-1"
          testID={`${props.testID}-hint`}
        >
          {props.hint}
        </AppText>
      )}
      {props.helper === undefined ? null : (
        <AppText
          variant="footnote"
          className="text-muted-foreground"
          testID={`${props.testID}-helper`}
        >
          {props.helper}
        </AppText>
      )}
    </>
  );
}

/** The M3 colours of the field, from the app theme. */
function fieldColors(
  theme: ReturnType<typeof useThemeColors>,
): NonNullable<Parameters<typeof OutlinedTextField>[0]["colors"]> {
  return {
    focusedTextColor: theme.foreground,
    unfocusedTextColor: theme.foreground,
    cursorColor: theme.primary,
    focusedIndicatorColor: theme.primary,
    unfocusedIndicatorColor: theme["muted-foreground"],
    focusedLabelColor: theme.primary,
    unfocusedLabelColor: theme["muted-foreground"],
    errorIndicatorColor: theme.expense,
    errorLabelColor: theme.expense,
    errorSupportingTextColor: theme.expense,
    errorCursorColor: theme.expense,
  };
}
