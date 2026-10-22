// The live rows of an items list (#112): one live read of `ITEM_LIST_TABLES` fed into the list model, so a write
// through any repository – the archive here, the form of #82 – lands on the screen without a refresh callback.
// Both items screens share it; only the archived screen lists the archived items.
import { ITEM_LIST_TABLES, readItems } from "@budget-lens/db";
import { useCallback } from "react";
import { useActiveMonth } from "@/db/use-active-month";
import { useLiveRead } from "@/db/use-live-read";
import { useSettings } from "@/db/use-settings";
import { useLanguage } from "@/ui/use-language";
import { type ListedRead, listFromReads } from "./item-rows";

/** A read items list: the rows of both sections, plus the state of the reads they came from. */
export interface ItemRows extends ListedRead {
  /** Runs the reads again – the retry of the error state. */
  readonly reload: () => void;
}

/**
 * The item rows of the month the app is on, in list order. What the three reads add up to is decided by the
 * tested `listFromReads`; this hook only wires them up.
 *
 * By default only the active items are listed; `archived: true` lists the archived ones instead – the read-only
 * list behind the "Archived items" row. Either way the read includes the archived items, because the count of
 * that row comes from the same read (#63).
 */
export function useItemRows(options: { readonly archived?: boolean } = {}): ItemRows {
  const archived = options.archived === true;
  const items = useLiveRead(ITEM_LIST_TABLES, (db) => readItems(db, { includeArchived: true }));
  const settings = useSettings();
  const active = useActiveMonth();
  const lang = useLanguage();
  const reloadItems = items.reload;
  const reloadSettings = settings.reload;
  const reloadMonth = active.reload;
  const reload = useCallback(() => {
    reloadItems();
    reloadSettings();
    reloadMonth();
  }, [reloadItems, reloadSettings, reloadMonth]);
  // The hook's own answer for the month: the stored one, or the calendar month while the table has none.
  const month = { status: active.status, value: active.month };
  return { ...listFromReads({ items, settings, month, lang, archived }), reload };
}
