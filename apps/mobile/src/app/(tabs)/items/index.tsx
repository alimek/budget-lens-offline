// The Items tab (#112): the income and expense items with their recurrence summaries, and the entry point to the
// archived list. Everything on it comes from one live read, so a write through any repository – the archive here,
// a save in the sheet – lands without a refresh callback. #82 adds the entry points to the item sheet: the add
// button, the empty-state call to action, tapping a row and the "edit" row action.

import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ArchiveDialog } from "@/features/items/archive-dialog";
import { itemRowActions } from "@/features/items/item-row-copy";
import type { ItemRow } from "@/features/items/item-rows";
import { ItemSectionList } from "@/features/items/item-section-list";
import { ItemSheet } from "@/features/items/item-sheet";
import { EmptyItems, ReadState } from "@/features/items/list-states";
import { useItemRows } from "@/features/items/use-item-rows";
import { AddButton } from "@/ui/native/add-button";
import { PrimaryButton } from "@/ui/native/button";
import { GroupedList, ListSection, NavigationRow } from "@/ui/native/list";

/** Which sheet is open: none, a new item, or the item with this id. */
type Sheet = { readonly itemId?: string } | null;

export default function ItemsScreen() {
  const { t } = useTranslation("items");
  const router = useRouter();
  const items = useItemRows();
  const [confirming, setConfirming] = useState<ItemRow | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const note = items.hasInvalidItems ? t("list.someInvalid") : undefined;

  const rowAction = (row: ItemRow, key: string) => {
    if (key === "edit") setSheet({ itemId: row.id });
    else setConfirming(row);
  };

  return (
    <View testID="screen-items" collapsable={false} className="flex-1 bg-background">
      <ReadState status={items.status} reload={items.reload}>
        {items.empty ? (
          <EmptyItems hasInvalidItems={items.hasInvalidItems}>
            <PrimaryButton
              testID="items-empty-add"
              label={t("empty.cta")}
              onPress={() => setSheet({})}
            />
          </EmptyItems>
        ) : null}
        <GroupedList testID="items-list">
          <ItemSectionList
            sections={items.sections}
            sectionTestIds={{ income: "items-section-income", expenses: "items-section-expenses" }}
            rowTestIdPrefix="items-row"
            actions={itemRowActions((key, options) => t(key, { ...options }))}
            onAction={rowAction}
            onPress={(row) => setSheet({ itemId: row.id })}
            note={note}
          />
          <ListSection>
            <NavigationRow
              testID="items-open-archived"
              label={t("list.archived")}
              // The count of what the row opens, from the same read as the list itself (#63).
              detail={String(items.archivedCount)}
              detailTestId="items-archived-count"
              accessibilityLabel={t("a11y.archived", { total: items.archivedCount })}
              onPress={() => router.push("/(tabs)/items/archived")}
            />
          </ListSection>
        </GroupedList>
      </ReadState>
      <AddButton testID="items-add" label={t("actions.add")} onPress={() => setSheet({})} />
      {sheet === null ? null : (
        <ItemSheet
          itemId={sheet.itemId}
          onClose={() => {
            setSheet(null);
          }}
        />
      )}
      <ArchiveDialog row={confirming} onClose={() => setConfirming(null)} />
    </View>
  );
}
