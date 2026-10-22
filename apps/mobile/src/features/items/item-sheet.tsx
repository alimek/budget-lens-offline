// The item sheet (#82): the one form that adds an item and edits it, built from the #63 handoff as amended by the
// decisions recorded on #63, #61 and #64. What the form holds and how it maps onto the data layer is the pure
// model in `item-form.ts`; what the sheet shows is the pure model in `item-sheet-model.ts`; what a save writes is
// `use-item-sheet-save.ts`. This file only wires the sheet's reads to those models and renders the result.
//
// Rules it exists to enforce: planning happens only against a *stored* active month, never the clock fallback,
// closed months are never offered or changed, a currency is chosen once and stays, a one-time item whose month is
// closed is read-only, and an item is archived rather than deleted (#63, decisions 1 and 4).
import { formatMoney, type Language } from "@budget-lens/core";
import { ITEM_LIST_TABLES, OVERRIDE_TABLES, readItems, readOverrides } from "@budget-lens/db";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useActiveMonth } from "@/db/use-active-month";
import { useLiveRead } from "@/db/use-live-read";
import { useSettings } from "@/db/use-settings";
import { Text } from "@/ui/components/text";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";
import { AppSheet } from "@/ui/native/sheet";
import { useLanguage } from "@/ui/use-language";
import {
  appliesFromDefault,
  countFormErrors,
  formAmount,
  type ItemFormState,
  initialForm,
  itemFormErrors,
  liveDryRun,
  NO_FORM_ERRORS,
  sheetReadOnly,
} from "./item-form";
import { SheetArchiveDialog, type SheetDialog, SheetDialogs } from "./item-sheet-dialogs";
import { FormFields, type SheetFields } from "./item-sheet-fields";
import { type SheetModel, saveAction, sheetModel, titleKey } from "./item-sheet-model";
import { SheetScroll, StaticRow } from "./item-sheet-parts";
import { ReadState } from "./list-states";
import { usePreview } from "./use-item-preview";
import { rememberedKind, useItemSheetSave } from "./use-item-sheet-save";

/** The sheet's two modes (#63): a new item, or the item with this id. */
export interface ItemSheetProps {
  /** The item to edit; `undefined` opens the sheet to create one. */
  readonly itemId: string | undefined;
  readonly onClose: () => void;
}

/**
 * The add/edit item sheet. Every month it *shows* comes from #112's display month; every month it *plans*
 * against is the stored one, so a missing `months` row never turns into a planned change (#82's planning rule).
 * After a save the sheet closes and #112's live read refreshes the list on its own.
 */
export function ItemSheet({ itemId, onClose }: ItemSheetProps) {
  const { t } = useTranslation("items");
  const lang = useLanguage();
  const month = useActiveMonth();
  const settings = useSettings();
  const items = useLiveRead(ITEM_LIST_TABLES, readItems);
  const overrides = useLiveRead(OVERRIDE_TABLES, readOverrides);
  const model = sheetModel({ month, settings, items, overrides, itemId, lang });
  const reload = () => {
    month.reload();
    settings.reload();
    items.reload();
    overrides.reload();
  };
  const editing = itemId !== undefined;
  return (
    <SheetBody
      model={model}
      title={t(titleKey(editing, false))}
      reload={reload}
      onClose={onClose}
    />
  );
}

interface SheetBodyProps {
  readonly model: SheetModel;
  /** The title of a sheet whose form has not arrived yet; the form names itself once it has. */
  readonly title: string;
  readonly reload: () => void;
  readonly onClose: () => void;
}

/** What the sheet shows: a read that has not landed, an item that vanished, or the form of #63. */
function SheetBody(props: SheetBodyProps) {
  const { model } = props;
  if (model.kind === "pending") {
    return (
      <PendingSheet
        status={model.status}
        title={props.title}
        reload={props.reload}
        onClose={props.onClose}
      />
    );
  }
  // The item vanished from under an open sheet (archived elsewhere): there is nothing left to show.
  if (model.kind === "missing") return null;
  // Keyed by what the form is built from, so another item, month, currency or language rebuilds it.
  return <SheetForm key={model.key} model={model} onClose={props.onClose} />;
}

/** A read that has not landed is the loading state and one that failed is the retry state (#63 states). */
function PendingSheet({
  status,
  title,
  reload,
  onClose,
}: {
  readonly status: "loading" | "ready" | "error";
  readonly title: string;
  readonly reload: () => void;
  readonly onClose: () => void;
}) {
  return (
    <AppSheet visible onDismiss={onClose} title={title} testID="item-sheet">
      <ReadState
        status={status}
        reload={reload}
        loadingTestID="item-sheet-loading"
        errorTestID="item-sheet-error"
      >
        {null}
      </ReadState>
    </AppSheet>
  );
}

/** The sheet's own dialogs plus the archive confirmation of #112. */
type SheetDialogState = SheetDialog | "archive";

interface SheetFormProps {
  readonly model: FormModel;
  readonly onClose: () => void;
}

/** The form variant of the sheet's model: what a form is built from. */
type FormModel = Extract<SheetModel, { readonly kind: "form" }>;

/** The sheet with its form: the fields, the live dry run behind the notices, and the save. */
function SheetForm({ model, onClose }: SheetFormProps) {
  const { t } = useTranslation("items");
  const [form, setForm] = useState<ItemFormState>(() => initialForm(formArgs(model)));
  const [replaceScheduled, setReplaceScheduled] = useState(false);
  const [resetKeptOverrides, setResetKeptOverrides] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [closedWhileEditing, setClosedWhileEditing] = useState(false);
  const [dialog, setDialog] = useState<SheetDialogState>("none");
  const readOnly = sheetReadOnly(model.item, form, model.displayMonth, closedWhileEditing);
  const editing = model.item !== undefined;
  const sheetTitleKey = titleKey(editing, readOnly);
  const sheetTestId = sheetTestID(readOnly);
  const save = useItemSheetSave({
    item: model.item,
    overrides: model.overrides,
    nextSortOrder: model.nextSortOrder,
    replaceScheduled,
    resetKeptOverrides,
  });
  const plan = liveDryRun({
    item: model.item,
    overrides: model.overrides,
    state: form,
    storedMonth: model.storedMonth,
    readOnly,
    replaceScheduled,
    resetKeptOverrides,
  });
  const fields: SheetFields = {
    form,
    item: model.item,
    displayMonth: model.displayMonth,
    baseCurrency: model.baseCurrency,
    usedCurrencies: model.usedCurrencies,
    lang: model.lang,
    errors: showErrors ? itemFormErrors(form) : NO_FORM_ERRORS,
    plan,
    replaceScheduled,
    resetKeptOverrides,
    onChange: changeForm,
    onReplaceScheduled: setReplaceScheduled,
    onResetKeptOverrides: setResetKeptOverrides,
  };

  function changeForm(patch: Partial<ItemFormState>) {
    setDirty(true);
    setForm((current) => ({ ...current, ...patch }));
  }

  /** One press of "Add" or "Save": the outcome says what the sheet has to do about it. */
  function requestSave(orphansConfirmed: boolean) {
    const outcome = save.run(model.storedMonth, form, orphansConfirmed);
    if (outcome.kind === "invalid") setShowErrors(true);
    if (outcome.kind === "orphans") setDialog("orphans");
    if (outcome.kind === "saved") onClose();
  }

  /** Closing a form with something in it is confirmed first (#63); a read-only sheet closes at once. */
  function requestClose() {
    if (readOnly === false && dirty) setDialog("discard");
    else onClose();
  }

  /** A month that closed under the user: recurring items recover with a later month, a one-time item goes read-only. */
  function acknowledgeFailure() {
    if (isOneTimeClosure(save.failure)) setClosedWhileEditing(true);
    save.acknowledge();
  }

  /** The recovery of #64: "Applies from" goes back to the first month the sheet may change, the inputs stay. */
  function pickLaterMonth() {
    const item = model.item;
    if (item !== undefined)
      changeForm({ appliesFrom: appliesFromDefault(item, model.displayMonth) });
  }

  return (
    <>
      <AppSheet visible onDismiss={requestClose} title={t(sheetTitleKey)} testID={sheetTestId}>
        {/* One scrolling column (#63): the form and its notices are taller than the screen. */}
        <SheetScroll>
          {readOnly ? (
            <ReadOnlyItem model={model} form={form} onDone={onClose} />
          ) : (
            <EditableForm
              model={model}
              fields={fields}
              onArchive={() => setDialog("archive")}
              onCancel={requestClose}
              onSave={() => requestSave(false)}
            />
          )}
        </SheetScroll>
      </AppSheet>
      <SheetDialogs
        dialog={sheetDialog(dialog)}
        plan={plan}
        failure={save.failure}
        displayMonth={model.displayMonth}
        onCloseDialog={() => setDialog("none")}
        onDiscard={onClose}
        onOrphansConfirmed={() => requestSave(true)}
        onMonthPicked={pickLaterMonth}
        onFailureAcknowledged={acknowledgeFailure}
      />
      <SheetArchiveDialog
        item={archivable(model.item)}
        open={dialog === "archive"}
        onArchived={onClose}
      />
    </>
  );
}

/** What the form is built from: the item, the month it is anchored to, and the session's kind (#63). */
function formArgs(model: FormModel) {
  return {
    item: model.item,
    activeMonth: model.displayMonth,
    baseCurrency: model.baseCurrency,
    lang: model.lang,
    kind: rememberedKind(),
  };
}

/** The archive confirmation names an id and a name, which is what #112's dialog needs. */
function archivable(item: FormModel["item"]) {
  return item === undefined ? undefined : { id: item.id, name: item.name };
}

/** The archive confirmation is the sheet's own state, but not one of the dialogs of #63 and #64. */
function sheetDialog(dialog: SheetDialogState): SheetDialog {
  return dialog === "archive" ? "none" : dialog;
}

/** The sheet's test ID: a read-only sheet is a different thing than the form (#64). */
function sheetTestID(readOnly: boolean): string {
  return readOnly ? "item-sheet-readonly" : "item-sheet";
}

/** Whether a refusal means the one-time item the user is editing has just closed (#64). */
function isOneTimeClosure(failure: ReturnType<typeof useItemSheetSave>["failure"]): boolean {
  return failure?.kind === "one-time-closed";
}

interface EditableFormProps {
  readonly model: FormModel;
  readonly fields: SheetFields;
  readonly onArchive: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

/** The editable sheet: the fields of #63, the error summary, the reason Save is off, and the actions. */
function EditableForm(props: EditableFormProps) {
  const errorCount = countFormErrors(props.fields.errors);
  return (
    <>
      <FormFields {...props.fields} />
      <ErrorSummary count={errorCount} visible={props.fields.errors !== NO_FORM_ERRORS} />
      <SaveBlocked visible={props.model.storedMonth === undefined} />
      <SheetActions
        editing={props.model.item !== undefined}
        canSave={props.model.storedMonth !== undefined}
        showArchive={props.model.item !== undefined}
        onArchive={props.onArchive}
        onCancel={props.onCancel}
        onSave={props.onSave}
      />
    </>
  );
}

/** The count of fields that need attention, under the fields (#63). */
function ErrorSummary({ count, visible }: { readonly count: number; readonly visible: boolean }) {
  const { t } = useTranslation("items");
  if (count === 0 || visible === false) return null;
  return (
    <Text testID="item-errors-summary" variant="footnote" className="text-expense">
      {t("errors.summary", { count })}
    </Text>
  );
}

/** Why Save is off while there is no stored active month: nothing may be planned against the fallback (#82). */
function SaveBlocked({ visible }: { readonly visible: boolean }) {
  const { t } = useTranslation("items");
  if (visible === false) return null;
  return (
    <Text testID="item-no-active-month" variant="footnote" className="text-muted-foreground">
      {t("form.noActiveMonth")}
    </Text>
  );
}

interface SheetActionsProps {
  readonly editing: boolean;
  /** Off while there is no stored active month to plan against (#82's planning rule). */
  readonly canSave: boolean;
  readonly showArchive: boolean;
  readonly onArchive: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

/** The sheet's actions: Add or Save, Archive while editing (#63, decision 1: archive only), and Cancel. */
function SheetActions(props: SheetActionsProps) {
  const { t } = useTranslation("items");
  const action = saveAction(props.editing);
  return (
    <>
      <PrimaryButton
        testID={action.testID}
        label={t(action.labelKey)}
        onPress={props.onSave}
        disabled={props.canSave === false}
      />
      {props.showArchive ? (
        <SecondaryButton
          testID="item-archive"
          label={t("actions.archive")}
          onPress={props.onArchive}
        />
      ) : null}
      <SecondaryButton testID="item-cancel" label={t("form.cancel")} onPress={props.onCancel} />
    </>
  );
}

interface ReadOnlyItemProps {
  readonly model: FormModel;
  readonly form: ItemFormState;
  readonly onDone: () => void;
}

/** The read-only sheet of #64: the values as static text, the reason, and Done as the only action. */
function ReadOnlyItem(props: ReadOnlyItemProps) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  const { model, form } = props;
  const preview = usePreview(form, model.displayMonth);
  const amount = formAmount(form);
  return (
    <>
      <StaticRow
        label={t("form.type")}
        value={t(form.kind === "income" ? "form.income" : "form.expense")}
        testID="item-type"
      />
      <StaticRow label={t("form.name")} value={form.name} testID="item-name" />
      <StaticRow
        label={tShared("amountInput.label")}
        value={amountText(form, amount, model.lang)}
        testID="item-amount"
      />
      <StaticRow
        label={t("form.month")}
        value={t("form.monthValue", { month: form.firstMonth })}
        testID="item-month"
      />
      {preview === undefined ? null : (
        <Text variant="footnote" className="text-muted-foreground">
          {preview.summary}
        </Text>
      )}
      <Text testID="item-one-time-closed" variant="footnote" className="text-muted-foreground">
        {t("form.oneTimeClosed", { month: form.firstMonth })}
      </Text>
      <PrimaryButton testID="item-sheet-done" label={t("form.done")} onPress={props.onDone} />
    </>
  );
}

/** The amount of a read-only item: the money in its own currency, or nothing while it has none. */
function amountText(
  form: ItemFormState,
  amount: ReturnType<typeof formAmount>,
  lang: Language,
): string {
  if (amount === undefined) return "";
  return `${formatMoney(amount, { lang, currency: form.currency })} ${form.currency}`;
}
