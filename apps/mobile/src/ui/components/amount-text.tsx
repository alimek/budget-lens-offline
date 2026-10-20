import type { CurrencyCode, Language, MinorUnits } from "@budget-lens/core";
import { type AmountSign, type AmountTone, formatAmount } from "@/ui/amount";
import { Text } from "@/ui/components/text";
import { cn } from "@/ui/lib/utils";
import { useLanguage } from "@/ui/use-language";

const toneClass: Record<AmountTone, string> = {
  income: "text-income",
  expense: "text-expense",
  neutral: "text-foreground",
};

interface AmountTextProps {
  amount: MinorUnits;
  currency?: CurrencyCode;
  sign?: AmountSign;
  /** `amount` for rows, `amount-lg` for totals. */
  size?: "amount" | "amount-lg";
  /** Colour by sign (income / expense); totals that are not a gain or loss pass `false`. */
  colored?: boolean;
  /** Formatting language; defaults to the app language. */
  lang?: Language;
  className?: string;
  testID?: string;
}

/** A money amount: `Intl` formatting, `+` / `−` sign, income / expense colour and tabular figures. */
export function AmountText({
  amount,
  currency = "PLN",
  sign = "auto",
  size = "amount",
  colored = true,
  lang,
  className,
  testID,
}: AmountTextProps) {
  const appLanguage = useLanguage();
  const language: Language = lang ?? appLanguage;
  const { text, tone } = formatAmount(amount, { lang: language, currency, sign });
  return (
    <Text
      variant={size}
      className={cn(toneClass[colored ? tone : "neutral"], className)}
      testID={testID}
    >
      {text}
    </Text>
  );
}
