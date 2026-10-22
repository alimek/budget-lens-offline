// The live rows of an items list (#112): one live read of `ITEM_LIST_TABLES` fed into the list model, so a write
// through any repository – the archive here, the form of #82 – lands on the screen without a refresh callback.
// Both items screens share it; only the archived screen asks for the archived items.
import { DEFAULT_SETTINGS } from "@budget-lens/core";
import { ITEM_LIST_TABLES, readItems } from "@budget-lens/db";
import { useActiveMonth } from "@/db/use-active-month";
import { useLiveRead } from "@/db/use-live-read";
import { useSettings } from "@/db/use-settings";
import { useLanguage } from "@/ui/use-language";
import { type ListedItems, listItems } from "./item-rows";

/** A read items list: the rows of both sections, plus the state of the read they came from. */
export interface ItemRows extends ListedItems {
  /** `loading` until the first read has run; `error` when the last one failed. */
  readonly status: "loading" | "ready" | "error";
  /** Runs the read again – the retry of the error state. */
  readonly reload: () => void;
}

/**
 * The item rows of the month the app is on, in list order. The rows themselves are built by the tested
 * `listItems`; this hook only wires the read, the settings and the month together.
 *
 * By default only the active items are listed; `archived: true` lists the archived ones instead – the read-only
 * list behind the "Archived items" row. A database with no `settings` row uses the core default base
 * currency (#78).
 */
export function useItemRows(options: { readonly archived?: boolean } = {}): ItemRows {
  const archived = options.archived === true;
  const items = useLiveRead(ITEM_LIST_TABLES, (db) =>
    readItems(db, archived ? { includeArchived: true } : {}),
  );
  const read = listItems(items.value, {
    activeMonth: useActiveMonth(),
    lang: useLanguage(),
    baseCurrency: useSettings().value?.baseCurrency ?? DEFAULT_SETTINGS.baseCurrency,
    ...(archived ? { onlyArchived: true } : {}),
  });
  return { ...read, status: items.status, reload: items.reload };
}
