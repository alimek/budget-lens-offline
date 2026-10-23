import { currencyExponent } from "@budget-lens/core";
import {
  Button,
  Host,
  TextField,
  type TextFieldRef,
  Toolbar,
  ToolbarItem,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  accessibilityHint,
  accessibilityLabel,
  keyboardType,
  monospacedDigit,
  multilineTextAlignment,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useRef } from "react";
import { View } from "react-native";
import { formatAmountNumber } from "../amount";
import { reformatAmountOnBlur } from "../amount-input";
import { Text as AppText } from "../components/text";
import { useThemeColors } from "../use-theme";
import { AppPicker } from "./picker";
import type { AmountInputProps } from "./types";
import { useSyncedText } from "./use-synced-text";

/** The modifiers the amount field takes. */
type FieldModifiers = NonNullable<Parameters<typeof TextField>[0]["modifiers"]>;

/** Width of the leading currency picker; a code and its menu chevron always fit. */
const CURRENCY_WIDTH = 108;

/**
 * The amount field of #61 on iOS: the currency picker leads and the value is a trailing-aligned SwiftUI
 * `TextField` with tabular figures, so the two read as one amount. The keyboard is the decimal pad, or the
 * number pad for a currency without minor digits; the decimal pad has no return key, so a keyboard toolbar adds
 * the one (#61). The field owns its text while it is focused and rewrites a valid value to the app language only
 * when it loses focus.
 */
export function AmountInput(props: AmountInputProps) {
  const theme = useThemeColors();
  const text = useNativeState(props.value);
  const handleChange = useSyncedText(text, props.value, props.onChangeText);
  const field = useRef<TextFieldRef>(null);
  return (
    <View className="gap-1 self-stretch">
      <AppText variant="footnote" className="text-muted-foreground" accessibilityElementsHidden>
        {props.label}
      </AppText>
      <View
        className="flex-row items-center gap-2 rounded-lg border-2 px-2"
        style={{ borderColor: fieldBorder(theme, props.error) }}
      >
        <CurrencySlot props={props} />
        <AmountValue
          props={props}
          text={text}
          onTextChange={handleChange}
          field={field}
          accent={theme.primary}
        />
      </View>
      <AmountNotes props={props} />
    </View>
  );
}

/** The border of the field: the error colour while what is typed is wrong (#61). */
function fieldBorder(theme: ReturnType<typeof useThemeColors>, error: string | undefined): string {
  return error === undefined ? theme.border : theme.expense;
}

/** The currency that leads the field: a menu while the item may still change it, plain text once it is locked. */
function CurrencySlot({ props }: { readonly props: AmountInputProps }) {
  const change = props.onCurrencyChange;
  if (change === undefined) {
    return (
      <AppText
        variant="body"
        className="text-muted-foreground"
        style={{ width: 64 }}
        testID={`${props.testID}-currency`}
      >
        {props.currency}
      </AppText>
    );
  }
  return (
    <View style={{ width: CURRENCY_WIDTH }}>
      <AppPicker
        label={props.currencyAccessibilityLabel ?? props.currency}
        hideLabel
        options={props.currencies}
        value={props.currency}
        onValueChange={change}
        testID={`${props.testID}-currency`}
      />
    </View>
  );
}

interface AmountValueProps {
  readonly props: AmountInputProps;
  readonly text: ReturnType<typeof useNativeState<string>>;
  readonly onTextChange: (next: string) => void;
  readonly field: React.RefObject<TextFieldRef | null>;
  readonly accent: string;
}

/** The value itself: the trailing-aligned decimal field and the Done key of its keyboard toolbar (#61). */
function AmountValue({ props, text, onTextChange, field, accent }: AmountValueProps) {
  const done = () => {
    onTextChange(reformat(text, props));
    void field.current?.blur();
  };
  return (
    <View className="flex-1">
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        <Toolbar>
          <TextField
            ref={field}
            text={text}
            placeholder={props.placeholder}
            onTextChange={onTextChange}
            onFocusChange={(focused) => {
              if (focused === false) done();
            }}
            testID={props.testID}
            modifiers={fieldModifiers(props, accent)}
          />
          <Toolbar.Content>
            <ToolbarItem placement="keyboard">
              <Button label={props.doneLabel} onPress={done} testID={`${props.testID}-done`} />
            </ToolbarItem>
          </Toolbar.Content>
        </Toolbar>
      </Host>
    </View>
  );
}

/**
 * What the field holds when it loses focus (#61, decision 2): a value the currency can hold is rewritten as the
 * app language writes it, and anything else stays exactly as typed. The rewritten text is what the caller keeps.
 */
function reformat(
  text: ReturnType<typeof useNativeState<string>>,
  props: AmountInputProps,
): string {
  const formatted = reformatAmountOnBlur(text.get(), props.currency, (amount) =>
    formatAmountNumber(amount, { lang: props.lang, currency: props.currency }),
  );
  text.set(formatted);
  return formatted;
}

/**
 * The name the field answers to: its label and the kind of amount it holds, so the value the system reads out is
 * the sentence of #61 – "Amount, expense, 240,00" – while the field's own value stays the amount as typed.
 */
function fieldName(props: AmountInputProps): string {
  return props.kindLabel === undefined ? props.label : `${props.label}, ${props.kindLabel}`;
}

/** The field's modifiers: the keyboard of the currency's digits, the trailing tabular value, its name (#61). */
function fieldModifiers(props: AmountInputProps, accent: string): FieldModifiers {
  return [
    keyboardType(
      currencyExponent(props.currency) === 0 ? "ascii-capable-number-pad" : "decimal-pad",
    ),
    multilineTextAlignment("trailing"),
    monospacedDigit(),
    tint(accent),
    accessibilityLabel(fieldName(props)),
    accessibilityHint(props.error ?? ""),
  ];
}

/** The muted lines under the field: the base value of #61, the helper, and the error (#63). */
function AmountNotes({ props }: { readonly props: AmountInputProps }) {
  return (
    <>
      {props.hint === undefined ? null : (
        <AppText
          variant="footnote"
          className="text-muted-foreground"
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
      {props.error === undefined ? null : (
        <AppText variant="footnote" className="text-expense" testID={`${props.testID}-error`}>
          {props.error}
        </AppText>
      )}
    </>
  );
}
