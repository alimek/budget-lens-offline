// The fields of the item sheet (#82), one small component each: the type, the name, the amount field of #61, the
// "Repeats" picker, the custom interval, the months, the preview sentence and "Applies from". Each one renders
// what `item-form.ts` already decided, so none of them works out a rule of its own and none of them branches
// beyond what its control needs.
import {
  CURRENCY_CODES,
  type CurrencyCode,
  currencyExponent,
  type ItemType,
  type Language,
  MAX_INTERVAL_MONTHS,
  type RuleEditPlan,
  type YearMonth,
} from "@budget-lens/core";
import type { StoredItem } from "@budget-lens/db";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { formatAmountNumber } from "@/ui/amount";
import { amountInputPlaceholder } from "@/ui/amount-input";
import { Text } from "@/ui/components/text";
import { AmountInput } from "@/ui/native/amount-input";
import { AppPicker } from "@/ui/native/picker";
import { SegmentedControl } from "@/ui/native/segmented-control";
import { AppStepper } from "@/ui/native/stepper";
import { AppTextField } from "@/ui/native/text-field";
import { AppToggle } from "@/ui/native/toggle";
import {
  APPLIES_FROM_MONTHS,
  appliesFromDefault,
  currencyOrder,
  firstMonthOptions,
  type ItemAmountError,
  type ItemFormErrors,
  type ItemFormState,
  LAST_MONTHS,
  monthOptions,
  REPEAT_PRESETS,
  type RepeatPreset,
  showsDayClampHint,
} from "./item-form";
import { FormNotices } from "./item-sheet-notices";
import {
  ErrorLine,
  errorText,
  HintLine,
  type MonthNamer,
  monthChoices,
  StaticRow,
} from "./item-sheet-parts";
import { usePreview } from "./use-item-preview";

/** Everything the fields render from: the form, the month it is anchored to, and the currency rules around it. */
export interface SheetFields {
  readonly form: ItemFormState;
  /** Absent in create mode, where the type is chosen and the currency is editable (#82). */
  readonly item: StoredItem | undefined;
  readonly displayMonth: YearMonth;
  readonly baseCurrency: CurrencyCode;
  readonly usedCurrencies: readonly CurrencyCode[];
  readonly lang: Language;
  /** The validation codes: none until the first save attempt (#63: validate on Add, then live). */
  readonly errors: ItemFormErrors;
  /** The live dry run behind the notices of #64, or none while there is nothing to plan. */
  readonly plan: RuleEditPlan | undefined;
  readonly replaceScheduled: boolean;
  readonly resetKeptOverrides: boolean;
  readonly onChange: (patch: Partial<ItemFormState>) => void;
  readonly onReplaceScheduled: (value: boolean) => void;
  readonly onResetKeptOverrides: (value: boolean) => void;
}

/** The editable form of #63, in the order the handoff lists the fields. */
export function FormFields(fields: SheetFields) {
  return (
    <>
      <TypeField fields={fields} />
      <NameField fields={fields} />
      <AmountField fields={fields} />
      <RepeatsField fields={fields} />
      <EveryField fields={fields} />
      <FirstMonthField fields={fields} />
      <DayField fields={fields} />
      <EndsField fields={fields} />
      <Preview fields={fields} />
      <AppliesFromField fields={fields} />
      <FormNotices
        plan={fields.plan}
        currency={fields.form.currency}
        lang={fields.lang}
        replaceScheduled={fields.replaceScheduled}
        resetKeptOverrides={fields.resetKeptOverrides}
        onReplaceScheduled={fields.onReplaceScheduled}
        onResetKeptOverrides={fields.onResetKeptOverrides}
      />
    </>
  );
}

/** The type of the item: fixed after creation, so an edit shows it as text (#40, #82). */
function TypeField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  if (fields.item !== undefined) {
    return (
      <StaticRow
        label={t("form.type")}
        value={t(fields.form.kind === "income" ? "form.income" : "form.expense")}
        testID="item-type"
      />
    );
  }
  return (
    <SegmentedControl<ItemType>
      testID="item-type"
      value={fields.form.kind}
      onValueChange={(kind) => fields.onChange({ kind })}
      options={[
        { value: "expense", label: t("form.expense") },
        { value: "income", label: t("form.income") },
      ]}
    />
  );
}

/** The name of the item, required by the validation of #63. */
function NameField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  return (
    <AppTextField
      testID="item-name"
      label={t("form.name")}
      placeholder={t("form.namePlaceholder")}
      value={fields.form.name}
      onChangeText={(name) => fields.onChange({ name })}
      error={errorText(fields.errors.name, t)}
    />
  );
}

/** The amount of the item: the #61 field, whose currency is editable only while creating. */
function AmountField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  const { form, item, baseCurrency, usedCurrencies, lang, errors } = fields;
  const editing = item !== undefined;
  const amountMessage = useAmountMessage(form.currency);
  return (
    <AmountInput
      testID="item-amount"
      label={tShared("amountInput.label")}
      value={form.amountText}
      onChangeText={(amountText) => fields.onChange({ amountText })}
      lang={lang}
      currency={form.currency}
      currencies={currencyChoices(baseCurrency, usedCurrencies, tShared)}
      onCurrencyChange={editing ? undefined : (currency) => fields.onChange({ currency })}
      placeholder={amountInputPlaceholder((amount) =>
        formatAmountNumber(amount, { lang, currency: form.currency }),
      )}
      error={amountMessage(errors.amount)}
      helper={t(editing ? "form.currencyLocked" : "form.amountHint")}
      hint={currencyHint(form.currency, baseCurrency, tShared)}
      doneLabel={tShared("common.done")}
      currencyAccessibilityLabel={tShared("amountInput.currencyA11y", {
        code: form.currency,
        name: tShared(`currency.names.${form.currency}`),
      })}
      accessibilityLabel={amountLabel(form, t, tShared)}
    />
  );
}

/** The "Repeats" picker; a one-time item gets the info row of #64 instead (#63, #64). */
function RepeatsField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, onChange } = fields;
  if (form.repeat === "one-time") {
    return (
      <HintLine
        testID="item-one-time-hint"
        text={t("form.oneTimeHint", { month: form.firstMonth })}
      />
    );
  }
  return (
    <AppPicker<RepeatPreset>
      testID="item-repeats"
      label={t("form.repeats")}
      value={form.repeat}
      onValueChange={(repeat) => onChange({ repeat })}
      options={REPEAT_PRESETS.map((preset) => ({ value: preset, label: t(REPEAT_KEYS[preset]) }))}
    />
  );
}

/** The custom interval: a stepper from 1 to 120 months, shown only when "Repeats" is Custom. */
function EveryField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, errors, onChange } = fields;
  if (form.repeat !== "custom") return null;
  return (
    <>
      <AppStepper
        testID="item-every"
        label={t("form.everyN", { count: form.intervalMonths })}
        value={form.intervalMonths}
        min={1}
        max={MAX_INTERVAL_MONTHS}
        onValueChange={(intervalMonths) => onChange({ intervalMonths })}
        decreaseLabel={t("form.decrease")}
        increaseLabel={t("form.increase")}
      />
      <ErrorLine testID="item-every-error" text={errorText(errors.interval, t)} />
    </>
  );
}

/** The anchor of the rule, or the single month of a one-time item (#63). */
function FirstMonthField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, item, displayMonth, onChange } = fields;
  const oneTime = form.repeat === "one-time";
  return (
    <AppPicker<YearMonth>
      testID={oneTime ? "item-month" : "item-first-month"}
      label={t(oneTime ? "form.month" : "form.firstMonth")}
      value={form.firstMonth}
      onValueChange={(firstMonth) => onChange({ firstMonth })}
      options={monthChoices(
        firstMonthOptions(displayMonth, item?.versions[0]?.effectiveFrom),
        displayMonth,
        nameMonth(t),
      )}
    />
  );
}

/** The day of month, with the hint about the shorter months when the day can be clamped (#63). */
function DayField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, onChange } = fields;
  return (
    <>
      <AppPicker<DayValue>
        testID="item-day"
        label={t("form.day")}
        value={String(form.dayOfMonth) as DayValue}
        onValueChange={(day) => onChange({ dayOfMonth: Number(day) })}
        options={DAY_OPTIONS.map((day) => ({ value: day, label: dayLabel(day, t) }))}
      />
      {showsDayClampHint(form) ? <HintLine text={t("form.dayClampHint")} /> : null}
    </>
  );
}

/** The "Ends" toggle and, when it is on, the last month with its own validation (#63). */
function EndsField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, errors, displayMonth, onChange } = fields;
  if (form.repeat === "one-time") return null;
  return (
    <>
      <AppToggle
        testID="item-ends"
        label={t("form.ends")}
        value={form.ends}
        onValueChange={(ends) => onChange({ ends })}
      />
      {form.ends ? (
        <>
          <AppPicker<YearMonth>
            testID="item-last-month"
            label={t("form.lastMonth")}
            value={form.lastMonth}
            onValueChange={(lastMonth) => onChange({ lastMonth })}
            options={monthChoices(
              monthOptions(form.firstMonth, LAST_MONTHS),
              displayMonth,
              nameMonth(t),
            )}
          />
          <ErrorLine testID="item-last-month-error" text={errorText(errors.lastMonth, t)} />
        </>
      ) : null}
    </>
  );
}

/** "Applies from" of a recurring edit (#64): the month the change starts from, and why it is bounded. */
function AppliesFromField({ fields }: { readonly fields: SheetFields }) {
  const { t } = useTranslation("items");
  const { form, item, displayMonth, onChange } = fields;
  if (form.repeat === "one-time" || item === undefined) return null;
  return (
    <View className="gap-1">
      <AppPicker<YearMonth>
        testID="item-applies-from"
        label={t("form.appliesFrom")}
        value={form.appliesFrom}
        onValueChange={(appliesFrom) => onChange({ appliesFrom })}
        options={monthChoices(
          monthOptions(appliesFromDefault(item, displayMonth), APPLIES_FROM_MONTHS),
          displayMonth,
          nameMonth(t),
        )}
      />
      <HintLine
        testID="item-applies-from-hint"
        text={t("form.appliesFromHint", { month: form.appliesFrom })}
      />
    </View>
  );
}

/** The plain-language preview of #63: what the rule describes, and the next dates it resolves to. */
function Preview({ fields }: { readonly fields: SheetFields }) {
  const preview = usePreview(fields.form, fields.displayMonth);
  const foreign = fields.form.currency !== fields.baseCurrency;
  if (preview === undefined) return null;
  return (
    <View testID="item-preview" className="gap-1">
      <Text variant="footnote" className="text-muted-foreground">
        {preview.summary}
      </Text>
      <Text variant="footnote" className="text-muted-foreground">
        {preview.next}
      </Text>
      {foreign ? (
        <Text variant="footnote" className="text-muted-foreground">
          {preview.noRate}
        </Text>
      ) : null}
    </View>
  );
}

/** The copy of each "Repeats" option, in the `items` namespace (#63). */
const REPEAT_KEYS: Record<
  RepeatPreset,
  | "form.repeat.oneTime"
  | "form.repeat.monthly"
  | "form.repeat.every2"
  | "form.repeat.quarterly"
  | "form.repeat.every6"
  | "form.repeat.yearly"
  | "form.repeat.custom"
> = {
  "one-time": "form.repeat.oneTime",
  monthly: "form.repeat.monthly",
  "every-2": "form.repeat.every2",
  quarterly: "form.repeat.quarterly",
  "every-6": "form.repeat.every6",
  yearly: "form.repeat.yearly",
  custom: "form.repeat.custom",
};

const DAY_OPTIONS: readonly DayValue[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
];

/** The day-of-month picker's values: "0" is "No specific day", then 1 … 31. */
type DayValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31";

/** The picker's label of the month the sheet is anchored to (#63: "(this month)"). */
function nameMonth(t: TFunction<"items">): MonthNamer {
  return (month, isThisMonth) => t(isThisMonth ? "form.thisMonth" : "form.monthValue", { month });
}

/** The day picker's label: the number, or the words for "No specific day". */
function dayLabel(day: DayValue, t: TFunction<"items">): string {
  return day === "0" ? t("form.dayNone") : day;
}

/** The line under a foreign amount while there is no rate store (#92): #61's no-rate state. */
function currencyHint(
  currency: CurrencyCode,
  base: CurrencyCode,
  tShared: TFunction,
): string | undefined {
  return currency === base ? undefined : tShared("amountInput.hint.noRate");
}

/** The accessible name of the amount: the kind and the amount typed (#61, `a11y.value`). */
function amountLabel(form: ItemFormState, t: TFunction<"items">, tShared: TFunction): string {
  const kind = t(form.kind === "income" ? "form.income" : "form.expense");
  return tShared("amountInput.a11y.value", { kind, amount: form.amountText });
}

/** The currencies of the picker, in the order of #61 decision 4, labelled "PLN · Polish zloty". */
function currencyChoices(
  base: CurrencyCode,
  used: readonly CurrencyCode[],
  tShared: TFunction,
): { readonly value: CurrencyCode; readonly label: string }[] {
  return currencyOrder(base, CURRENCY_CODES, used).map((code) => ({
    value: code,
    label: `${code} · ${tShared(`currency.names.${code}`)}`,
  }));
}

/**
 * The message a rejected amount shows. `errors.amountZero` is a code of the `items` namespace (#63, decision 3)
 * and the rest are the keys of `validateAmountInput` in the shared `translation` namespace. The two fraction keys
 * name the currency's exponent or the currency itself (#61), which only this field knows.
 */
function useAmountMessage(
  currency: CurrencyCode,
): (error: ItemAmountError | undefined) => string | undefined {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  return (error) => amountMessageText(error, currency, t, tShared);
}

/** The code of the `items` namespace stands alone; the rest are keys of #61 in the shared namespace. */
function amountMessageText(
  error: ItemAmountError | undefined,
  currency: CurrencyCode,
  t: TFunction<"items">,
  tShared: TFunction,
): string | undefined {
  if (error === undefined) return undefined;
  if (error === "errors.amountZero") return t(error);
  return sharedAmountMessage(error, currency, tShared);
}

/** The two fraction keys name the currency's exponent or the currency itself; the rest need nothing. */
function sharedAmountMessage(
  error: Exclude<ItemAmountError, "errors.amountZero">,
  currency: CurrencyCode,
  tShared: TFunction,
): string {
  if (error === "amountInput.tooManyFractionDigits") {
    return tShared(error, { count: currencyExponent(currency) });
  }
  if (error === "amountInput.noFractionDigits") return tShared(error, { currency });
  return tShared(error);
}
