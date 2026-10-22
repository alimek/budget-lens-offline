// The notices of #64 (#82), read off the live dry run: the scheduled change, the months that keep their own
// amount, and the item that will be archived because the change leaves it with no versions. Every decision about
// *which* notice and *which* copy is made by the tested model in `item-sheet-model.ts`; this file only renders it
// and keeps each component small enough to read at a glance.
import {
  type CurrencyCode,
  formatMoney,
  type Language,
  type OccurrenceOverride,
  type RuleEditPlan,
  type YearMonth,
} from "@budget-lens/core";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, View } from "react-native";
import { Text } from "@/ui/components/text";
import { SecondaryButton } from "@/ui/native/button";
import { AppToggle } from "@/ui/native/toggle";
import {
  archivesItem,
  type ScheduledNotice,
  type SheetAnnouncement,
  scheduledNotice,
  scheduledNoticeCopy,
  sheetAnnouncement,
} from "./item-sheet-model";
import { HintLine, Notice } from "./item-sheet-parts";

/** What the notices render from: the dry run, the item's currency, and the two toggles #64 offers. */
export interface FormNoticesProps {
  /** The live dry run (#64), or none while there is nothing to plan. */
  readonly plan: RuleEditPlan | undefined;
  /** The item's currency, for the amounts of the months that keep their own. */
  readonly currency: CurrencyCode;
  readonly lang: Language;
  readonly replaceScheduled: boolean;
  readonly resetKeptOverrides: boolean;
  readonly onReplaceScheduled: (value: boolean) => void;
  readonly onResetKeptOverrides: (value: boolean) => void;
}

/** The notices of the sheet: one component per notice, each silent when the plan says nothing about it. */
export function FormNotices(props: FormNoticesProps) {
  const { plan } = props;
  const notice = scheduledNotice(plan);
  useNoticeAnnouncement(plan, notice, props.replaceScheduled);
  if (plan === undefined) return null;
  return (
    <>
      {notice === undefined ? null : (
        <ScheduledNoticeRow
          notice={notice}
          replacing={props.replaceScheduled}
          onReplaceScheduled={props.onReplaceScheduled}
        />
      )}
      <KeptOverridesNotice
        overrides={plan.keptOverrides}
        currency={props.currency}
        lang={props.lang}
        reset={props.resetKeptOverrides}
        onReset={props.onResetKeptOverrides}
      />
      {archivesItem(plan) ? <NoVersionsNotice /> : null}
    </>
  );
}

interface ScheduledNoticeRowProps {
  readonly notice: ScheduledNotice;
  readonly replacing: boolean;
  readonly onReplaceScheduled: (value: boolean) => void;
}

/**
 * The scheduled-change notice: while the later change is kept it offers "Replace it with this change", and once
 * replace is chosen it offers "Keep the scheduled change" to undo it (#64, decision 3).
 */
function ScheduledNoticeRow({ notice, replacing, onReplaceScheduled }: ScheduledNoticeRowProps) {
  const { t } = useTranslation("items");
  const copy = scheduledNoticeCopy(notice, replacing);
  return (
    <Notice
      testID="item-notice-scheduled"
      title={t(copy.titleKey, { month: notice.month })}
      text={t(copy.bodyKey, { month: notice.month })}
    >
      <SecondaryButton
        testID={copy.actionTestID}
        label={t(copy.actionKey)}
        onPress={() => onReplaceScheduled(!replacing)}
      />
    </Notice>
  );
}

interface KeptOverridesNoticeProps {
  readonly overrides: readonly OccurrenceOverride[];
  readonly currency: CurrencyCode;
  readonly lang: Language;
  readonly reset: boolean;
  readonly onReset: (value: boolean) => void;
}

/** The months that keep their own one-off amount (#40, #83), with the reset toggle of #64, off by default. */
function KeptOverridesNotice(props: KeptOverridesNoticeProps) {
  const { t } = useTranslation("items");
  const { overrides } = props;
  if (overrides.length === 0) return null;
  return (
    <Notice
      testID="item-notice-kept"
      title={t("notice.keptOverrides.title", { count: overrides.length })}
      text={t("notice.keptOverrides.body")}
    >
      <View className="gap-1">
        {overrides.map((override) => (
          <KeptOverrideRow
            key={override.month}
            override={override}
            currency={props.currency}
            lang={props.lang}
          />
        ))}
      </View>
      <AppToggle
        testID="item-notice-kept-reset"
        label={t("notice.keptOverrides.reset")}
        value={props.reset}
        onValueChange={props.onReset}
      />
      <HintLine text={t("notice.keptOverrides.resetHint")} />
    </Notice>
  );
}

/** One kept month: the month nominative and long, with its own amount or the word "Skipped" (#64). */
function KeptOverrideRow({
  override,
  currency,
  lang,
}: {
  readonly override: OccurrenceOverride;
  readonly currency: CurrencyCode;
  readonly lang: Language;
}) {
  const { t } = useTranslation("items");
  const label = keptRowLabel(
    t("form.monthValue", { month: override.month }),
    override,
    currency,
    lang,
    t("notice.keptOverrides.skipped"),
  );
  return (
    <Text
      testID={`item-notice-kept-${override.month}`}
      variant="footnote"
      accessibilityLabel={label}
    >
      {label}
    </Text>
  );
}

/** The notice of #64 for a change that leaves the item with no versions: saving it archives the item (#81). */
function NoVersionsNotice() {
  const { t } = useTranslation("items");
  return <Notice testID="item-notice-no-versions" text={t("notice.noVersionsLeft")} />;
}

/** A kept month as it reads: "February 2027, 2 300,00 zł" or "May 2027, Skipped" (#64). */
function keptRowLabel(
  month: string,
  override: OccurrenceOverride,
  currency: CurrencyCode,
  lang: Language,
  skipped: string,
): string {
  const amount = override.amount;
  return amount === undefined
    ? `${month}, ${skipped}`
    : `${month}, ${formatMoney(amount, { lang, currency })}`;
}

/**
 * What the notices have to say when they change: focus stays on the field the user is editing, so nothing would
 * be read on its own (#64's accessibility note). An empty message is silence.
 */
function useNoticeAnnouncement(
  plan: RuleEditPlan | undefined,
  notice: ScheduledNotice | undefined,
  replacing: boolean,
) {
  const { t } = useTranslation("items");
  useAnnouncement(announcementMessage(sheetAnnouncement(plan, notice), replacing, t));
}

/** The three notice titles an announcement can read out. */
type AnnouncementKey =
  | "notice.scheduledKept.title"
  | "notice.scheduledReplaced.title"
  | "notice.keptOverrides.title";

/** The sentence a notice change announces: the scheduled change first, then the months that keep their own. */
function announcementMessage(
  announcement: SheetAnnouncement,
  replacing: boolean,
  t: (key: AnnouncementKey, options: { month?: YearMonth; count?: number }) => string,
): string {
  if (announcement.kind === "scheduled") {
    const copy = scheduledNoticeCopy(announcement.notice, replacing);
    return t(copy.titleKey, { month: announcement.notice.month });
  }
  if (announcement.kind === "kept") {
    return t("notice.keptOverrides.title", { count: announcement.count });
  }
  return "";
}

/** The one announcement effect, shared by the notices: it speaks a message once, and never the same one twice. */
function useAnnouncement(message: string) {
  const last = useRef("");
  useEffect(() => {
    if (message === "" || message === last.current) return;
    last.current = message;
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
